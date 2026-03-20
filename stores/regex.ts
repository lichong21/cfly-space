import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { RegexTemplate } from '@/types/regex';
import { REGEX_STORAGE_KEY } from '@/types/regex';

export const useRegexStore = defineStore('regex', () => {
  const customTemplates = ref<RegexTemplate[]>([]);

  // Restore from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get([REGEX_STORAGE_KEY], (result) => {
      if (result[REGEX_STORAGE_KEY]) {
        customTemplates.value = result[REGEX_STORAGE_KEY] as RegexTemplate[];
      }
    });
  }

  // Persist changes
  watch(customTemplates, (val) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [REGEX_STORAGE_KEY]: val });
    }
  }, { deep: true });

  function addTemplate(name: string, pattern: string, flags: string) {
    customTemplates.value.push({
      id: crypto.randomUUID(),
      name,
      pattern,
      flags,
      category: 'custom',
      isBuiltin: false,
    });
  }

  function removeTemplate(id: string) {
    customTemplates.value = customTemplates.value.filter(t => t.id !== id);
  }

  return { customTemplates, addTemplate, removeTemplate };
});
