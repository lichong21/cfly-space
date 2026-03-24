import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Note, MarkdownState } from '@/types/markdown';
import { DEFAULT_NOTE_CONTENT, DEFAULT_MARKDOWN_STATE } from '@/types/markdown';

const STORAGE_KEY = 'markdown';

export const useMarkdownStore = defineStore('markdown', () => {
  const notes = ref<Note[]>([]);
  const activeNoteId = ref<string | null>(null);
  const initialized = ref(false);

  const activeNote = computed(() =>
    notes.value.find(n => n.id === activeNoteId.value) ?? null,
  );

  const sortedNotes = computed(() =>
    [...notes.value].sort((a, b) => b.updatedAt - a.updatedAt),
  );

  // Restore from chrome.storage (promise-based)
  const initPromise = new Promise<void>((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY]) {
          const saved = result[STORAGE_KEY] as MarkdownState;
          notes.value = saved.notes || [];
          activeNoteId.value = saved.activeNoteId;
        }
        initialized.value = true;
        resolve();
      });
    } else {
      initialized.value = true;
      resolve();
    }
  });

  // Persist changes — only after initialization to avoid overwriting stored data
  watch([notes, activeNoteId], () => {
    if (!initialized.value) return;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const data: MarkdownState = {
        notes: notes.value,
        activeNoteId: activeNoteId.value,
      };
      chrome.storage.local.set({ [STORAGE_KEY]: data });
    }
  }, { deep: true });

  function createNote(title?: string, content?: string): Note {
    const now = Date.now();
    const note: Note = {
      id: crypto.randomUUID(),
      title: title || '未命名笔记',
      content: content ?? DEFAULT_NOTE_CONTENT,
      createdAt: now,
      updatedAt: now,
    };
    notes.value.push(note);
    activeNoteId.value = note.id;
    return note;
  }

  function updateNoteContent(id: string, content: string) {
    const note = notes.value.find(n => n.id === id);
    if (note) {
      note.content = content;
      note.updatedAt = Date.now();
    }
  }

  function updateNoteTitle(id: string, title: string) {
    const note = notes.value.find(n => n.id === id);
    if (note) {
      note.title = title;
      note.updatedAt = Date.now();
    }
  }

  function deleteNote(id: string) {
    const idx = notes.value.findIndex(n => n.id === id);
    if (idx === -1) return;
    notes.value.splice(idx, 1);
    if (activeNoteId.value === id) {
      activeNoteId.value = notes.value.length > 0 ? notes.value[0].id : null;
    }
  }

  function setActiveNote(id: string) {
    activeNoteId.value = id;
  }

  return {
    notes,
    activeNoteId,
    activeNote,
    sortedNotes,
    initialized,
    initPromise,
    createNote,
    updateNoteContent,
    updateNoteTitle,
    deleteNote,
    setActiveNote,
  };
});
