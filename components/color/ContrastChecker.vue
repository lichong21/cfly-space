<script lang="ts" setup>
import { ref, computed } from 'vue';
import { parseColor, checkContrast, formatRgb } from '@/composables/useColor';

const fgInput = ref('#000000');
const bgInput = ref('#ffffff');

const fgRgb = computed(() => parseColor(fgInput.value));
const bgRgb = computed(() => parseColor(bgInput.value));

const result = computed(() => {
  if (!fgRgb.value || !bgRgb.value) return null;
  return checkContrast(fgRgb.value, bgRgb.value);
});
</script>

<template>
  <div class="contrast-checker">
    <div class="input-row">
      <label class="cfg">
        <span class="cfg-label">前景色</span>
        <div class="color-input-wrap">
          <input type="color" :value="fgInput" @input="fgInput = ($event.target as HTMLInputElement).value" class="color-swatch-input" />
          <input v-model="fgInput" class="cfg-input" />
        </div>
      </label>
      <label class="cfg">
        <span class="cfg-label">背景色</span>
        <div class="color-input-wrap">
          <input type="color" :value="bgInput" @input="bgInput = ($event.target as HTMLInputElement).value" class="color-swatch-input" />
          <input v-model="bgInput" class="cfg-input" />
        </div>
      </label>
    </div>

    <div v-if="result" class="result-area">
      <div class="ratio-display">
        <span class="ratio-value">{{ result.ratio }}:1</span>
      </div>
      <div class="wcag-grid">
        <div class="wcag-item" :class="{ pass: result.aa }">
          <span class="wcag-level">AA 普通</span>
          <span class="wcag-status">{{ result.aa ? 'PASS' : 'FAIL' }}</span>
        </div>
        <div class="wcag-item" :class="{ pass: result.aaLarge }">
          <span class="wcag-level">AA 大字</span>
          <span class="wcag-status">{{ result.aaLarge ? 'PASS' : 'FAIL' }}</span>
        </div>
        <div class="wcag-item" :class="{ pass: result.aaa }">
          <span class="wcag-level">AAA 普通</span>
          <span class="wcag-status">{{ result.aaa ? 'PASS' : 'FAIL' }}</span>
        </div>
        <div class="wcag-item" :class="{ pass: result.aaaLarge }">
          <span class="wcag-level">AAA 大字</span>
          <span class="wcag-status">{{ result.aaaLarge ? 'PASS' : 'FAIL' }}</span>
        </div>
      </div>

      <!-- Preview -->
      <div class="preview-box" :style="{ background: bgInput, color: fgInput }">
        <p class="preview-normal">正常文字预览 Normal text</p>
        <p class="preview-large">大号文字预览</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contrast-checker {
  padding: 12px 0;
}

.input-row { display: flex; gap: 16px; margin-bottom: 14px; }
.cfg { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.cfg-label { font-size: 11px; color: #6b7280; font-weight: 600; }
.color-input-wrap { display: flex; gap: 6px; align-items: center; }
.color-swatch-input { width: 32px; height: 32px; border: 1px solid #d1d5db; border-radius: 6px; padding: 2px; cursor: pointer; }
.cfg-input { flex: 1; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; font-family: 'SF Mono', Monaco, monospace; color: #374151; outline: none; }
.cfg-input:focus { border-color: #1a73e8; }

.result-area { margin-top: 8px; }
.ratio-display { text-align: center; margin-bottom: 12px; }
.ratio-value { font-size: 28px; font-weight: 700; color: #1a1a2e; }

.wcag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 14px; }
.wcag-item { display: flex; justify-content: space-between; padding: 8px 12px; border-radius: 6px; background: #fef2f2; border: 1px solid #fecaca; }
.wcag-item.pass { background: #f0fdf4; border-color: #bbf7d0; }
.wcag-level { font-size: 12px; color: #6b7280; }
.wcag-status { font-size: 12px; font-weight: 700; }
.wcag-item.pass .wcag-status { color: #16a34a; }
.wcag-item:not(.pass) .wcag-status { color: #dc2626; }

.preview-box { padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
.preview-normal { margin: 0 0 6px; font-size: 14px; }
.preview-large { margin: 0; font-size: 20px; font-weight: 700; }
</style>
