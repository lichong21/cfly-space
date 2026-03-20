import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { ClipboardEntry } from '@/types/clipboard';
import { STORAGE_KEY_CLIPBOARD, MAX_CLIPBOARD_ENTRIES } from '@/types/clipboard';

export const useClipboardStore = defineStore('clipboard', () => {
  const entries = ref<ClipboardEntry[]>([]);

  // Restore from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get([STORAGE_KEY_CLIPBOARD], (result) => {
      if (result[STORAGE_KEY_CLIPBOARD]) {
        entries.value = result[STORAGE_KEY_CLIPBOARD] as ClipboardEntry[];
      }
    });
  }

  watch(entries, (val) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY_CLIPBOARD]: val });
    }
  }, { deep: true });

  const sortedEntries = computed(() =>
    [...entries.value].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return b.createdAt - a.createdAt;
    }),
  );

  function detectContentType(content: string): ClipboardEntry['contentType'] {
    if (/^https?:\/\//i.test(content.trim())) return 'url';
    if (/^-?\d+(\.\d+)?$/.test(content.trim())) return 'number';
    if (/[{}\[\]();=]/.test(content) || /^\s*(function|const|let|var|import|class|def|func)\b/.test(content)) return 'code';
    return 'text';
  }

  function addEntry(content: string, sourceTitle = '', sourceUrl = '') {
    // Deduplicate: if same content exists, move to top
    const existingIdx = entries.value.findIndex(e => e.content === content);
    if (existingIdx >= 0) {
      const existing = entries.value.splice(existingIdx, 1)[0];
      existing.createdAt = Date.now();
      entries.value.unshift(existing);
      return;
    }

    entries.value.unshift({
      id: crypto.randomUUID(),
      content,
      contentType: detectContentType(content),
      sourceTitle,
      sourceUrl,
      isFavorite: false,
      createdAt: Date.now(),
    });

    // Keep only non-favorite entries within limit
    const favorites = entries.value.filter(e => e.isFavorite);
    const others = entries.value.filter(e => !e.isFavorite);
    if (others.length > MAX_CLIPBOARD_ENTRIES) {
      entries.value = [...favorites, ...others.slice(0, MAX_CLIPBOARD_ENTRIES)];
    }
  }

  function removeEntry(id: string) {
    entries.value = entries.value.filter(e => e.id !== id);
  }

  function toggleFavorite(id: string) {
    const entry = entries.value.find(e => e.id === id);
    if (entry) entry.isFavorite = !entry.isFavorite;
  }

  function clearAll() {
    entries.value = entries.value.filter(e => e.isFavorite);
  }

  return { entries, sortedEntries, addEntry, removeEntry, toggleFavorite, clearAll };
});
