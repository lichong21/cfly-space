<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useCopy } from '@/composables/useCopy';

const { copied, copy } = useCopy();
const copiedIdx = ref(-1);

const length = ref(16);
const count = ref(5);
const useUpper = ref(true);
const useLower = ref(true);
const useDigits = ref(true);
const useSpecial = ref(false);
const results = ref<string[]>([]);

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

const charset = computed(() => {
  let cs = '';
  if (useUpper.value) cs += UPPER;
  if (useLower.value) cs += LOWER;
  if (useDigits.value) cs += DIGITS;
  if (useSpecial.value) cs += SPECIAL;
  return cs;
});

const strength = computed(() => {
  const bits = Math.log2(charset.value.length || 1) * length.value;
  if (bits < 28) return { level: '弱', color: '#ef4444' };
  if (bits < 36) return { level: '一般', color: '#f59e0b' };
  if (bits < 60) return { level: '强', color: '#22c55e' };
  return { level: '非常强', color: '#1a73e8' };
});

function generate() {
  if (!charset.value) return;
  const arr = new Uint32Array(length.value * count.value);
  crypto.getRandomValues(arr);
  results.value = Array.from({ length: count.value }, (_, i) => {
    return Array.from({ length: length.value }, (_, j) => {
      return charset.value[arr[i * length.value + j] % charset.value.length];
    }).join('');
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
      <label class="cfg">
        <span class="cfg-label">长度</span>
        <input v-model.number="length" type="number" min="1" max="256" class="cfg-input small" />
      </label>
      <label class="cfg">
        <span class="cfg-label">数量</span>
        <input v-model.number="count" type="number" min="1" max="50" class="cfg-input small" />
      </label>
      <div class="charset-checks">
        <label class="check"><input type="checkbox" v-model="useUpper" /><span>A-Z</span></label>
        <label class="check"><input type="checkbox" v-model="useLower" /><span>a-z</span></label>
        <label class="check"><input type="checkbox" v-model="useDigits" /><span>0-9</span></label>
        <label class="check"><input type="checkbox" v-model="useSpecial" /><span>特殊</span></label>
      </div>
      <button class="btn-primary" @click="generate" :disabled="!charset">生成</button>
    </div>
    <div class="strength-bar">
      密码强度：<span :style="{ color: strength.color, fontWeight: 600 }">{{ strength.level }}</span>
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
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.cfg { display: flex; flex-direction: column; gap: 4px; }
.cfg-label { font-size: 11px; color: #6b7280; font-weight: 600; }
.cfg-input { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #374151; outline: none; }
.cfg-input.small { width: 70px; }
.cfg-input:focus { border-color: #1a73e8; }

.charset-checks { display: flex; gap: 10px; align-items: center; }
.check { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #374151; cursor: pointer; }

.strength-bar { font-size: 12px; color: #6b7280; margin-bottom: 12px; }

.btn-primary { padding: 7px 16px; border: none; border-radius: 6px; background: #1a73e8; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-primary:hover { background: #1557b0; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.result-list { display: flex; flex-direction: column; gap: 4px; }
.result-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 6px; }
.result-text { font-size: 13px; font-family: 'SF Mono', Monaco, monospace; color: #374151; word-break: break-all; }
.btn-copy { padding: 2px 8px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; font-size: 11px; color: #6b7280; cursor: pointer; flex-shrink: 0; }
.btn-copy:hover { border-color: #1a73e8; color: #1a73e8; }
</style>
