import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { IndentType, ViewMode } from '@/types';

export const useJsonStore = defineStore('json', () => {
  const input = ref('');
  const indent = ref<IndentType>('2');
  const viewMode = ref<ViewMode>('text');

  // Restore persisted settings from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['indent', 'viewMode'], (result: Record<string, unknown>) => {
      if (result.indent) indent.value = result.indent as IndentType;
      if (result.viewMode) viewMode.value = result.viewMode as ViewMode;
    });
  }

  // Persist settings changes
  watch(indent, (val) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ indent: val });
    }
  });

  watch(viewMode, (val) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ viewMode: val });
    }
  });

  return { input, indent, viewMode };
});
