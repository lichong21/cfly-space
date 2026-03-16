import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
import type { WaterConfig, WaterState, WaterMessage, WaterStatus } from '@/types/water';
import { DEFAULT_WATER_CONFIG, DEFAULT_WATER_STATE } from '@/types/water';

const STORAGE_KEY_CONFIG = 'waterConfig';
const STORAGE_KEY_STATE = 'waterState';

export const useWaterStore = defineStore('water', () => {
  const config = ref<WaterConfig>({ ...DEFAULT_WATER_CONFIG });
  const state = ref<WaterState>({ ...DEFAULT_WATER_STATE });
  const nextAlarmTime = ref<number | null>(null);

  // Restore from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get([STORAGE_KEY_CONFIG, STORAGE_KEY_STATE], (result) => {
      if (result[STORAGE_KEY_CONFIG]) {
        config.value = { ...DEFAULT_WATER_CONFIG, ...result[STORAGE_KEY_CONFIG] };
      }
      if (result[STORAGE_KEY_STATE]) {
        const saved = { ...DEFAULT_WATER_STATE, ...result[STORAGE_KEY_STATE] };
        // 跨天重置计数
        if (saved.todayDate !== new Date().toDateString()) {
          saved.todayCount = 0;
          saved.todayDate = new Date().toDateString();
        }
        state.value = saved;
      }
      // 如果之前是启用的，恢复 alarm
      if (state.value.enabled) {
        sendMessage('start');
      }
    });
  }

  // Persist config changes
  watch(config, (val) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY_CONFIG]: val });
    }
    if (state.value.enabled) {
      sendMessage('start');
    }
  }, { deep: true });

  // Persist state changes
  watch(state, (val) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY_STATE]: val });
    }
  }, { deep: true });

  const isPaused = computed(() => {
    return state.value.pausedUntil !== null && Date.now() < state.value.pausedUntil;
  });

  function sendMessage(action: WaterMessage['action'], payload?: WaterMessage['payload']) {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const msg: WaterMessage = { type: 'water', action, payload: { config: config.value, ...payload } };
      chrome.runtime.sendMessage(msg).catch(() => {
        // background may not be ready yet
      });
    }
  }

  async function refreshStatus() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        const status: WaterStatus = await chrome.runtime.sendMessage({
          type: 'water',
          action: 'getStatus',
        });
        if (status) {
          nextAlarmTime.value = status.nextAlarmTime;
          state.value.todayCount = status.todayCount;
        }
      } catch {
        // background not ready
      }
    }
  }

  function toggleEnabled() {
    state.value.enabled = !state.value.enabled;
    if (state.value.enabled) {
      sendMessage('start');
    } else {
      sendMessage('stop');
      nextAlarmTime.value = null;
    }
  }

  function updateConfig(partial: Partial<WaterConfig>) {
    config.value = { ...config.value, ...partial };
  }

  function pause(minutes: number) {
    state.value.pausedUntil = Date.now() + minutes * 60 * 1000;
    sendMessage('pause', { pauseMinutes: minutes });
  }

  function resume() {
    state.value.pausedUntil = null;
    sendMessage('start');
  }

  function skip() {
    sendMessage('skip');
  }

  function triggerNow() {
    sendMessage('trigger');
  }

  return {
    config,
    state,
    nextAlarmTime,
    isPaused,
    toggleEnabled,
    updateConfig,
    pause,
    resume,
    skip,
    triggerNow,
    refreshStatus,
  };
});
