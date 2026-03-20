<script lang="ts" setup>
import { ref, watch } from 'vue';
import CodecLayout from './CodecLayout.vue';

const input = ref('');
const output = ref('');
const error = ref('');

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const ENTITY_TO_CHAR: Record<string, string> = Object.fromEntries(
  Object.entries(HTML_ENTITIES).map(([k, v]) => [v, k]),
);

function encode() {
  error.value = '';
  output.value = input.value.replace(/[&<>"']/g, ch => HTML_ENTITIES[ch] || ch);
}

function decode() {
  error.value = '';
  // Handle named entities and numeric entities
  output.value = input.value
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, entity => ENTITY_TO_CHAR[entity] || entity)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
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
      <button class="btn-action encode" @click="encode">Encode ↓</button>
      <button class="btn-action decode" @click="decode">Decode ↑</button>
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
