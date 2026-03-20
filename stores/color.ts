import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { ColorPalette } from '@/types/color';
import { STORAGE_KEY_COLOR, DEFAULT_COLOR_STATE } from '@/types/color';

export const useColorStore = defineStore('color', () => {
  const palettes = ref<ColorPalette[]>(structuredClone(DEFAULT_COLOR_STATE.palettes));

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get([STORAGE_KEY_COLOR], (result) => {
      if (result[STORAGE_KEY_COLOR]) {
        palettes.value = result[STORAGE_KEY_COLOR] as ColorPalette[];
      }
    });
  }

  watch(palettes, (val) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY_COLOR]: val });
    }
  }, { deep: true });

  function addColor(hex: string, paletteId = 'default') {
    const palette = palettes.value.find(p => p.id === paletteId);
    if (palette && !palette.colors.includes(hex)) {
      palette.colors.push(hex);
    }
  }

  function removeColor(hex: string, paletteId = 'default') {
    const palette = palettes.value.find(p => p.id === paletteId);
    if (palette) {
      palette.colors = palette.colors.filter(c => c !== hex);
    }
  }

  function addPalette(name: string) {
    palettes.value.push({
      id: crypto.randomUUID(),
      name,
      colors: [],
    });
  }

  function removePalette(id: string) {
    if (id === 'default') return;
    palettes.value = palettes.value.filter(p => p.id !== id);
  }

  return { palettes, addColor, removeColor, addPalette, removePalette };
});
