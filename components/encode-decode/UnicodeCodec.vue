<script lang="ts" setup>
import { ref, watch } from 'vue';
import CodecLayout from './CodecLayout.vue';

const input = ref('');
const output = ref('');
const error = ref('');

function encode() {
  error.value = '';
  output.value = Array.from(input.value)
    .map(ch => {
      const code = ch.codePointAt(0)!;
      if (code > 127) {
        return code > 0xffff
          ? `\\u{${code.toString(16)}}`
          : `\\u${code.toString(16).padStart(4, '0')}`;
      }
      return ch;
    })
    .join('');
}

function decode() {
  try {
    error.value = '';
    output.value = input.value
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  } catch (e) {
    error.value = `反转义失败：${(e as Error).message}`;
  }
}

watch(input, () => {
  if (input.value) encode();
  else { output.value = ''; error.value = ''; }
});

function swap() {
  input.value = output.value;
}
</script>

<template>
  <CodecLayout
    :input="input"
    :output="output"
    :error="error"
    @update:input="input = $event"
    @swap="swap"
  >
    <template #actions>
      <button class="btn-action encode" @click="encode">转义 ↓</button>
      <button class="btn-action decode" @click="decode">反转义 ↑</button>
    </template>
  </CodecLayout>
</template>

<style scoped>
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
