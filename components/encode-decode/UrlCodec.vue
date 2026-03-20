<script lang="ts" setup>
import { ref, watch } from 'vue';
import CodecLayout from './CodecLayout.vue';

const input = ref('');
const output = ref('');
const error = ref('');
const mode = ref<'component' | 'full'>('component');

function encode() {
  try {
    error.value = '';
    output.value = mode.value === 'component'
      ? encodeURIComponent(input.value)
      : encodeURI(input.value);
  } catch (e) {
    error.value = `编码失败：${(e as Error).message}`;
  }
}

function decode() {
  try {
    error.value = '';
    output.value = mode.value === 'component'
      ? decodeURIComponent(input.value)
      : decodeURI(input.value);
  } catch (e) {
    error.value = `解码失败：${(e as Error).message}`;
  }
}

watch(input, () => {
  if (input.value) encode();
  else { output.value = ''; error.value = ''; }
});

watch(mode, () => {
  if (input.value) encode();
});

function swap() {
  const tmp = output.value;
  input.value = tmp;
}
</script>

<template>
  <div>
    <div class="mode-row">
      <label class="radio-label">
        <input type="radio" v-model="mode" value="component" />
        <span>encodeURIComponent</span>
      </label>
      <label class="radio-label">
        <input type="radio" v-model="mode" value="full" />
        <span>encodeURI（保留 URL 结构）</span>
      </label>
    </div>
    <CodecLayout
      :input="input"
      :output="output"
      :error="error"
      @update:input="input = $event"
      @swap="swap"
    >
      <template #actions>
        <button class="btn-action encode" @click="encode">Encode ↓</button>
        <button class="btn-action decode" @click="decode">Decode ↑</button>
      </template>
    </CodecLayout>
  </div>
</template>

<style scoped>
.mode-row {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.btn-action {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-action.encode {
  background: #1a73e8;
  color: #fff;
}

.btn-action.encode:hover {
  background: #1557b0;
}

.btn-action.decode {
  background: #e5e7eb;
  color: #374151;
}

.btn-action.decode:hover {
  background: #d1d5db;
}
</style>
