import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Snippet, SnippetFolder, SnippetState } from '@/types/snippet';
import { STORAGE_KEY_SNIPPETS, DEFAULT_FOLDER_ID } from '@/types/snippet';

export const useSnippetStore = defineStore('snippet', () => {
  const snippets = ref<Snippet[]>([]);
  const folders = ref<SnippetFolder[]>([]);

  // Restore from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get([STORAGE_KEY_SNIPPETS], (result) => {
      if (result[STORAGE_KEY_SNIPPETS]) {
        const saved = result[STORAGE_KEY_SNIPPETS] as SnippetState;
        snippets.value = saved.snippets || [];
        folders.value = saved.folders || [];
      }
    });
  }

  watch([snippets, folders], () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const data: SnippetState = { snippets: snippets.value, folders: folders.value };
      chrome.storage.local.set({ [STORAGE_KEY_SNIPPETS]: data });
    }
  }, { deep: true });

  const sortedSnippets = computed(() =>
    [...snippets.value].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    }),
  );

  const allTags = computed(() => {
    const tags = new Set<string>();
    snippets.value.forEach(s => s.tags.forEach(t => tags.add(t)));
    return [...tags].sort();
  });

  function createSnippet(data: Pick<Snippet, 'title' | 'code' | 'language' | 'description' | 'tags' | 'folderId'>): Snippet {
    const now = Date.now();
    const snippet: Snippet = {
      ...data,
      id: crypto.randomUUID(),
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };
    snippets.value.push(snippet);
    return snippet;
  }

  function updateSnippet(id: string, updates: Partial<Omit<Snippet, 'id' | 'createdAt'>>) {
    const s = snippets.value.find(x => x.id === id);
    if (s) {
      Object.assign(s, updates, { updatedAt: Date.now() });
    }
  }

  function deleteSnippet(id: string) {
    snippets.value = snippets.value.filter(s => s.id !== id);
  }

  function toggleFavorite(id: string) {
    const s = snippets.value.find(x => x.id === id);
    if (s) s.isFavorite = !s.isFavorite;
  }

  function addFolder(name: string) {
    const maxOrder = folders.value.reduce((max, f) => Math.max(max, f.order), -1);
    folders.value.push({ id: crypto.randomUUID(), name, order: maxOrder + 1 });
  }

  function removeFolder(id: string) {
    folders.value = folders.value.filter(f => f.id !== id);
    snippets.value.forEach(s => {
      if (s.folderId === id) s.folderId = DEFAULT_FOLDER_ID;
    });
  }

  function exportData(): string {
    return JSON.stringify({ snippets: snippets.value, folders: folders.value }, null, 2);
  }

  function importData(json: string) {
    try {
      const data = JSON.parse(json) as SnippetState;
      if (data.snippets) snippets.value.push(...data.snippets);
      if (data.folders) {
        const existingIds = new Set(folders.value.map(f => f.id));
        data.folders.forEach(f => {
          if (!existingIds.has(f.id)) folders.value.push(f);
        });
      }
    } catch {
      throw new Error('无效的 JSON 格式');
    }
  }

  return {
    snippets,
    folders,
    sortedSnippets,
    allTags,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    toggleFavorite,
    addFolder,
    removeFolder,
    exportData,
    importData,
  };
});
