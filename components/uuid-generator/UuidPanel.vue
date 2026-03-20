<script lang="ts" setup>
import { ref } from 'vue';
import { useCopy } from '@/composables/useCopy';

const { copied, copy } = useCopy();
const copiedIdx = ref(-1);

const count = ref(5);
const format = ref<'standard' | 'nohyphen' | 'upper'>('standard');
const results = ref<string[]>([]);

function generate() {
  results.value = Array.from({ length: count.value }, () => {
    let uuid = crypto.randomUUID();
    if (format.value === 'nohyphen') uuid = uuid.replace(/-/g, '');
    if (format.value === 'upper') uuid = uuid.toUpperCase();
    return uuid;
  });
}

async function copyOne(text: string, idx: number) {
  copiedIdx.value = idx;
  await copy(text);
}

async function copyAll() {
  copiedIdx.value = -2;
  await copy(results.value.join('\n'));
}

generate();
</script>

<template>
  <div class="uuid-panel">
    <div class="config-row">
      <label class="cfg">
        <span class="cfg-label">数量</span>
        <input v-model.number="count" type="number" min="1" max="50" class="cfg-input small" />
      </label>
      <label class="cfg">
        <span class="cfg-label">格式</span>
        <select v-model="format" class="cfg-input">
          <option value="standard">标准（带连字符）</option>
          <option value="nohyphen">无连字符</option>
          <option value="upper">大写</option>
        </select>
      </label>
      <button class="btn-primary" @click="generate">生成</button>
      <button class="btn-outline" @click="copyAll" :disabled="results.length === 0">
        {{ copied && copiedIdx === -2 ? '已复制' : '复制全部' }}
      </button>
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
.config-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.cfg {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cfg-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
}

.cfg-input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  outline: none;
}

.cfg-input.small {
  width: 70px;
}

.cfg-input:focus {
  border-color: #1a73e8;
}

.btn-primary {
  padding: 7px 16px;
  border: none;
  border-radius: 6px;
  background: #1a73e8;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover { background: #1557b0; }

.btn-outline {
  padding: 7px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
}

.btn-outline:hover:not(:disabled) {
  border-color: #1a73e8;
  color: #1a73e8;
}

.btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

.result-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
}

.result-text {
  font-size: 13px;
  font-family: 'SF Mono', Monaco, monospace;
  color: #374151;
  word-break: break-all;
}

.btn-copy {
  padding: 2px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  font-size: 11px;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-copy:hover {
  border-color: #1a73e8;
  color: #1a73e8;
}
</style>
