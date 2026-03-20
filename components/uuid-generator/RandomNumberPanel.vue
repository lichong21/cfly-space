<script lang="ts" setup>
import { ref } from 'vue';
import { useCopy } from '@/composables/useCopy';

const { copied, copy } = useCopy();
const copiedIdx = ref(-1);

const mode = ref<'integer' | 'float'>('integer');
const min = ref(0);
const max = ref(100);
const decimals = ref(2);
const count = ref(5);
const results = ref<string[]>([]);

function generate() {
  const arr = new Uint32Array(count.value);
  crypto.getRandomValues(arr);

  results.value = Array.from({ length: count.value }, (_, i) => {
    const rand = arr[i] / 0xffffffff; // 0~1
    if (mode.value === 'integer') {
      return String(Math.floor(rand * (max.value - min.value + 1)) + min.value);
    }
    const val = rand * (max.value - min.value) + min.value;
    return val.toFixed(decimals.value);
  });
}

async function copyOne(text: string, idx: number) {
  copiedIdx.value = idx;
  await copy(text);
}

generate();
</script>

<template>
  <div>
    <div class="config-row">
      <div class="mode-switch">
        <button class="mode-btn" :class="{ active: mode === 'integer' }" @click="mode = 'integer'">整数</button>
        <button class="mode-btn" :class="{ active: mode === 'float' }" @click="mode = 'float'">浮点数</button>
      </div>
      <label class="cfg">
        <span class="cfg-label">最小值</span>
        <input v-model.number="min" type="number" class="cfg-input small" />
      </label>
      <label class="cfg">
        <span class="cfg-label">最大值</span>
        <input v-model.number="max" type="number" class="cfg-input small" />
      </label>
      <label v-if="mode === 'float'" class="cfg">
        <span class="cfg-label">小数位</span>
        <input v-model.number="decimals" type="number" min="0" max="10" class="cfg-input small" />
      </label>
      <label class="cfg">
        <span class="cfg-label">数量</span>
        <input v-model.number="count" type="number" min="1" max="50" class="cfg-input small" />
      </label>
      <button class="btn-primary" @click="generate">生成</button>
    </div>
    <div class="result-list">
      <div v-for="(r, i) in results" :key="i" class="result-row">
        <code class="result-text">{{ r }}</code>
        <button class="btn-copy" @click="copyOne(r, i)">
          {{ copied && copiedIdx === i ? '已复制' : '复制' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-row { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.mode-switch { display: flex; background: #f3f4f6; border-radius: 6px; padding: 2px; }
.mode-btn { padding: 5px 12px; border: none; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; background: transparent; color: #6b7280; transition: all 0.15s; }
.mode-btn.active { background: #fff; color: #1a73e8; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
.cfg { display: flex; flex-direction: column; gap: 4px; }
.cfg-label { font-size: 11px; color: #6b7280; font-weight: 600; }
.cfg-input { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #374151; outline: none; }
.cfg-input.small { width: 80px; }
.cfg-input:focus { border-color: #1a73e8; }
.btn-primary { padding: 7px 16px; border: none; border-radius: 6px; background: #1a73e8; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-primary:hover { background: #1557b0; }
.result-list { display: flex; flex-direction: column; gap: 4px; }
.result-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 6px; }
.result-text { font-size: 13px; font-family: 'SF Mono', Monaco, monospace; color: #374151; }
.btn-copy { padding: 2px 8px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; font-size: 11px; color: #6b7280; cursor: pointer; flex-shrink: 0; }
.btn-copy:hover { border-color: #1a73e8; color: #1a73e8; }
</style>
