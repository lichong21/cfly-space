<script lang="ts" setup>
import { useCopy } from '@/composables/useCopy';

const props = defineProps<{
  input: string;
  output: string;
  error?: string;
}>();

const emit = defineEmits<{
  'update:input': [value: string];
  'update:output': [value: string];
  swap: [];
}>();

const { copied, copy } = useCopy();

function handleSwap() {
  emit('swap');
}
</script>

<template>
  <div class="codec-layout">
    <div class="codec-columns">
      <div class="codec-col">
        <div class="col-header">
          <span class="col-label">输入</span>
          <button class="btn-sm" @click="emit('update:input', '')">清空</button>
        </div>
        <textarea
          class="codec-textarea"
          :value="props.input"
          @input="emit('update:input', ($event.target as HTMLTextAreaElement).value)"
          placeholder="在此输入内容..."
          rows="10"
        />
      </div>

      <div class="codec-actions">
        <slot name="actions" />
        <button class="btn-swap" title="互换输入输出" @click="handleSwap">⇄</button>
      </div>

      <div class="codec-col">
        <div class="col-header">
          <span class="col-label">输出</span>
          <button class="btn-sm" @click="copy(props.output)" :disabled="!props.output">
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>
        <textarea
          class="codec-textarea output"
          :value="props.output"
          readonly
          placeholder="转换结果将显示在此..."
          rows="10"
        />
      </div>
    </div>
    <div v-if="props.error" class="codec-error">{{ props.error }}</div>
  </div>
</template>

<style scoped>
.codec-layout {
  margin-top: 12px;
}

.codec-columns {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.codec-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.col-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.codec-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  color: #374151;
  outline: none;
  resize: vertical;
  flex: 1;
  min-height: 200px;
  box-sizing: border-box;
}

.codec-textarea:focus {
  border-color: #1a73e8;
}

.codec-textarea.output {
  background: #f9fafb;
}

.codec-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  padding-top: 24px;
}

.btn-swap {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-swap:hover {
  background: #f0f4ff;
  border-color: #1a73e8;
  color: #1a73e8;
}

.btn-sm {
  padding: 3px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  font-size: 11px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-sm:hover:not(:disabled) {
  background: #f0f4ff;
  border-color: #1a73e8;
  color: #1a73e8;
}

.btn-sm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.codec-error {
  margin-top: 10px;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 12px;
  color: #dc2626;
}
</style>
