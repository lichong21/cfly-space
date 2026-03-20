import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { TimestampRecord } from '@/types/timestamp';
import { MAX_HISTORY_COUNT, STORAGE_KEY_TIMESTAMP_HISTORY } from '@/types/timestamp';

export const useTimestampStore = defineStore('timestamp', () => {
  const history = ref<TimestampRecord[]>([]);

  // Restore from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get([STORAGE_KEY_TIMESTAMP_HISTORY], (result) => {
      if (result[STORAGE_KEY_TIMESTAMP_HISTORY]) {
        history.value = result[STORAGE_KEY_TIMESTAMP_HISTORY] as TimestampRecord[];
      }
    });
  }

  // Persist changes
  watch(history, (val) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY_TIMESTAMP_HISTORY]: val });
    }
  }, { deep: true });

  function addRecord(record: Omit<TimestampRecord, 'id' | 'createdAt'>) {
    const entry: TimestampRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    history.value.unshift(entry);
    if (history.value.length > MAX_HISTORY_COUNT) {
      history.value = history.value.slice(0, MAX_HISTORY_COUNT);
    }
  }

  function clearHistory() {
    history.value = [];
  }

  return {
    history,
    addRecord,
    clearHistory,
  };
});
