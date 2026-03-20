<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useCopy } from '@/composables/useCopy';
import { useColorStore } from '@/stores/color';
import { parseColor, rgbToHex, rgbToHsl, formatRgb, formatHsl } from '@/composables/useColor';
import ContrastChecker from './ContrastChecker.vue';

const { copied, copy } = useCopy();
const copiedKey = ref('');
const store = useColorStore();

const colorInput = ref('#667eea');
const activePaletteId = ref('default');
const newPaletteName = ref('');
const showContrast = ref(false);

const rgb = computed(() => parseColor(colorInput.value));
const hex = computed(() => rgb.value ? rgbToHex(rgb.value) : '');
const hsl = computed(() => rgb.value ? rgbToHsl(rgb.value) : null);

const formats = computed(() => {
  if (!rgb.value || !hsl.value) return [];
  return [
    { label: 'HEX', value: hex.value, key: 'hex' },
    { label: 'RGB', value: formatRgb(rgb.value), key: 'rgb' },
    { label: 'HSL', value: formatHsl(hsl.value), key: 'hsl' },
  ];
});

const inputError = computed(() => {
  if (!colorInput.value.trim()) return '';
  return rgb.value ? '' : '无效的颜色值';
});

async function copyFormat(value: string, key: string) {
  copiedKey.value = key;
  await copy(value);
}

async function pickColor() {
  try {
    const eyeDropper = new (window as any).EyeDropper();
    const result = await eyeDropper.open();
    colorInput.value = result.sRGBHex;
  } catch {
    // User cancelled or API not supported
  }
}

const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

function addToFavorites() {
  if (hex.value) {
    store.addColor(hex.value, activePaletteId.value);
  }
}

function createPalette() {
  if (!newPaletteName.value.trim()) return;
  store.addPalette(newPaletteName.value.trim());
  newPaletteName.value = '';
}
</script>

<template>
  <div class="color-tool">
    <div class="panel-header">
      <h2 class="panel-title">颜色工具</h2>
      <p class="panel-desc">颜色格式互转、取色、对比度检查、调色板收藏</p>
    </div>

    <div class="main-area">
      <!-- Left: Color picker -->
      <div class="picker-col">
        <div class="color-input-area">
          <input
            type="color"
            :value="hex || '#000000'"
            @input="colorInput = ($event.target as HTMLInputElement).value"
            class="native-picker"
          />
          <input
            v-model="colorInput"
            class="text-input"
            placeholder="#667eea 或 rgb(102,126,234)"
          />
          <button v-if="hasEyeDropper" class="btn-pick" @click="pickColor" title="屏幕取色">
            <span>🎯</span>
          </button>
        </div>
        <div v-if="inputError" class="input-error">{{ inputError }}</div>

        <!-- Color Preview -->
        <div v-if="rgb" class="color-preview" :style="{ background: hex }">
          <button class="btn-fav" @click="addToFavorites" title="收藏此颜色">♥</button>
        </div>
      </div>

      <!-- Right: Formats -->
      <div class="formats-col">
        <div v-if="formats.length > 0" class="format-list">
          <div v-for="f in formats" :key="f.key" class="format-item">
            <span class="format-label">{{ f.label }}</span>
            <div class="format-value-row">
              <code class="format-value">{{ f.value }}</code>
              <button class="btn-copy" @click="copyFormat(f.value, f.key)">
                {{ copied && copiedKey === f.key ? '已复制' : '复制' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contrast Checker -->
    <div class="section collapsible">
      <button class="collapse-header" @click="showContrast = !showContrast">
        <h3 class="section-title">对比度检查</h3>
        <span class="collapse-icon" :class="{ expanded: showContrast }">▶</span>
      </button>
      <div v-if="showContrast" class="collapse-body">
        <ContrastChecker />
      </div>
    </div>

    <!-- Palettes -->
    <div class="section">
      <h3 class="section-title">调色板</h3>
      <div class="palette-tabs">
        <button
          v-for="p in store.palettes"
          :key="p.id"
          class="palette-tab"
          :class="{ active: activePaletteId === p.id }"
          @click="activePaletteId = p.id"
        >
          {{ p.name }}
          <span v-if="p.id !== 'default'" class="del-palette" @click.stop="store.removePalette(p.id)">&times;</span>
        </button>
        <div class="add-palette">
          <input v-model="newPaletteName" class="add-input" placeholder="新建..." @keydown.enter="createPalette" />
        </div>
      </div>
      <div class="palette-colors">
        <div
          v-for="c in (store.palettes.find(p => p.id === activePaletteId)?.colors ?? [])"
          :key="c"
          class="palette-swatch"
          :style="{ background: c }"
          :title="c"
          @click="colorInput = c"
        >
          <button class="swatch-del" @click.stop="store.removeColor(c, activePaletteId)">&times;</button>
        </div>
        <div v-if="(store.palettes.find(p => p.id === activePaletteId)?.colors ?? []).length === 0" class="empty-hint">
          点击预览区 ♥ 添加颜色到调色板
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-tool {
  padding: 28px 32px;
  max-width: 720px;
  overflow-y: auto;
  height: 100%;
}

.panel-header { margin-bottom: 20px; }
.panel-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0; }
.panel-desc { font-size: 13px; color: #9ca3af; margin: 6px 0 0; }

.main-area { display: flex; gap: 24px; margin-bottom: 20px; }
.picker-col { flex-shrink: 0; width: 240px; }
.formats-col { flex: 1; min-width: 0; }

.color-input-area { display: flex; gap: 8px; align-items: center; }
.native-picker { width: 40px; height: 40px; border: 1px solid #d1d5db; border-radius: 8px; padding: 2px; cursor: pointer; }
.text-input { flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; font-family: 'SF Mono', Monaco, monospace; color: #374151; outline: none; }
.text-input:focus { border-color: #1a73e8; }
.btn-pick { width: 36px; height: 36px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
.btn-pick:hover { border-color: #1a73e8; }
.input-error { font-size: 12px; color: #dc2626; margin-top: 6px; }

.color-preview {
  width: 100%;
  height: 120px;
  border-radius: 10px;
  margin-top: 12px;
  border: 1px solid rgba(0,0,0,0.1);
  position: relative;
}

.btn-fav {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.8);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-fav:hover { background: rgba(255,255,255,1); color: #ef4444; }

.format-list { display: flex; flex-direction: column; gap: 8px; }
.format-item { padding: 10px 14px; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; }
.format-label { font-size: 11px; color: #9ca3af; display: block; margin-bottom: 4px; }
.format-value-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.format-value { font-size: 13px; font-weight: 600; color: #374151; }
.btn-copy { padding: 2px 8px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; font-size: 11px; color: #6b7280; cursor: pointer; flex-shrink: 0; }
.btn-copy:hover { border-color: #1a73e8; color: #1a73e8; }

/* Collapsible */
.section { margin-bottom: 20px; }
.section-title { font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
.collapsible { border: 1px solid #f3f4f6; border-radius: 10px; overflow: hidden; }
.collapse-header { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 12px 16px; border: none; background: #f9fafb; cursor: pointer; }
.collapse-header:hover { background: #f3f4f6; }
.collapse-icon { font-size: 10px; color: #9ca3af; transition: transform 0.2s; }
.collapse-icon.expanded { transform: rotate(90deg); }
.collapse-body { padding: 12px 16px; }

/* Palettes */
.palette-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin: 10px 0; }
.palette-tab { padding: 4px 10px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; font-size: 12px; color: #6b7280; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.palette-tab.active { border-color: #1a73e8; color: #1a73e8; background: #f0f4ff; }
.del-palette { color: #9ca3af; font-size: 14px; line-height: 1; }
.del-palette:hover { color: #ef4444; }
.add-palette { display: flex; }
.add-input { padding: 4px 8px; border: 1px dashed #d1d5db; border-radius: 4px; font-size: 12px; width: 80px; outline: none; }
.add-input:focus { border-color: #1a73e8; }

.palette-colors { display: flex; flex-wrap: wrap; gap: 6px; min-height: 40px; }
.palette-swatch { width: 36px; height: 36px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1); cursor: pointer; position: relative; transition: transform 0.1s; }
.palette-swatch:hover { transform: scale(1.1); }
.swatch-del { position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; border-radius: 50%; border: none; background: #ef4444; color: #fff; font-size: 10px; cursor: pointer; display: none; align-items: center; justify-content: center; line-height: 1; }
.palette-swatch:hover .swatch-del { display: flex; }
.empty-hint { font-size: 12px; color: #9ca3af; padding: 8px 0; }
</style>
