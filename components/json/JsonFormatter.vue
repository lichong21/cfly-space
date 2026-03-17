<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useJsonStore } from '@/stores/json';
import { formatJson, compressJson, validateJson, highlightJson } from '@/composables/useJsonFormatter';
import { useCopy } from '@/composables/useCopy';
import JsonTreeNode from './JsonTreeNode.vue';
import type { JsonTreeNodeData, IndentType } from '@/types';

const store = useJsonStore();
const { copied, copy } = useCopy();

const output = ref('');
const error = ref<{ message: string; line: number; column: number } | null>(null);

function handleFormat() {
  if (!store.input.trim()) return;
  const err = validateJson(store.input);
  if (err) {
    error.value = err;
    output.value = '';
    return;
  }
  error.value = null;
  output.value = formatJson(store.input, store.indent);
}

function handleCompress() {
  if (!store.input.trim()) return;
  const err = validateJson(store.input);
  if (err) {
    error.value = err;
    output.value = '';
    return;
  }
  error.value = null;
  output.value = compressJson(store.input);
}

function handleCopy() {
  if (output.value) {
    copy(output.value);
  }
}

function handleClear() {
  store.input = '';
  output.value = '';
  error.value = null;
}

function onIndentChange(e: Event) {
  store.indent = (e.target as HTMLSelectElement).value as IndentType;
  if (output.value && !error.value) {
    handleFormat();
  }
}

const highlightedOutput = computed(() => {
  if (!output.value) return '';
  return highlightJson(output.value);
});

const treeData = computed<JsonTreeNodeData[]>(() => {
  if (!output.value) return [];
  try {
    const parsed = JSON.parse(output.value);
    return buildTree(parsed);
  } catch {
    return [];
  }
});

function buildTree(value: unknown, key = 'root'): JsonTreeNodeData[] {
  if (value === null) {
    return [{ key, value: null, type: 'null' }];
  }
  if (Array.isArray(value)) {
    const children = value.map((item, index) => buildTree(item, String(index))).flat();
    return [{ key, value, type: 'array', children, length: value.length }];
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const children = entries.map(([k, v]) => buildTree(v, k)).flat();
    return [{ key, value, type: 'object', children, length: entries.length }];
  }
  const type = typeof value === 'string' ? 'string'
    : typeof value === 'number' ? 'number'
    : typeof value === 'boolean' ? 'boolean'
    : 'null';
  return [{ key, value, type }];
}
</script>

<template>
  <div class="json-formatter">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-group">
        <button class="btn btn-primary" @click="handleFormat">
          <span class="btn-icon">&#9654;</span> 格式化
        </button>
        <button class="btn" @click="handleCompress">压缩</button>
        <span class="divider-v" />
        <button class="btn" @click="handleCopy" :disabled="!output">
          {{ copied ? '已复制 !' : '复制' }}
        </button>
        <button class="btn btn-ghost" @click="handleClear">清空</button>
      </div>
      <div class="toolbar-group">
        <span class="toolbar-label">缩进</span>
        <select class="select" :value="store.indent" @change="onIndentChange">
          <option value="2">2 空格</option>
          <option value="4">4 空格</option>
          <option value="tab">Tab</option>
        </select>
        <span class="divider-v" />
        <span class="toolbar-label">视图</span>
        <div class="toggle-group">
          <button
            class="toggle-btn"
            :class="{ active: store.viewMode === 'text' }"
            @click="store.viewMode = 'text'"
          >文本</button>
          <button
            class="toggle-btn"
            :class="{ active: store.viewMode === 'tree' }"
            @click="store.viewMode = 'tree'"
            :disabled="!output"
          >树形</button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-bar">
      <span class="error-dot" />
      JSON 语法错误：{{ error.message }}（第 {{ error.line }} 行，第 {{ error.column }} 列）
    </div>

    <!-- Editor -->
    <div class="editor">
      <!-- Input -->
      <div class="pane">
        <div class="pane-header">
          <span class="pane-title">输入</span>
        </div>
        <div class="pane-body">
          <textarea
            v-model="store.input"
            class="code-input"
            placeholder='在此粘贴 JSON...'
            spellcheck="false"
            @keydown.meta.enter="handleFormat"
            @keydown.ctrl.enter="handleFormat"
          />
        </div>
      </div>

      <!-- Center Actions -->
      <div class="editor-divider">
        <button class="divider-btn" @click="handleFormat" title="格式化">&#9654;</button>
      </div>

      <!-- Output -->
      <div class="pane">
        <div class="pane-header">
          <span class="pane-title">输出</span>
          <span v-if="output" class="pane-meta">
            {{ store.viewMode === 'tree' ? '树形视图' : '文本视图' }}
          </span>
        </div>
        <div class="pane-body">
          <template v-if="output">
            <div v-if="store.viewMode === 'text'" class="code-output">
              <pre><code v-html="highlightedOutput" /></pre>
            </div>
            <div v-else class="tree-output">
              <JsonTreeNode
                v-for="(node, i) in treeData"
                :key="i"
                :node="node"
              />
            </div>
          </template>
          <div v-else class="empty-state">
            <div class="empty-icon">{ }</div>
            <p class="empty-text">粘贴 JSON 后点击格式化</p>
            <p class="empty-hint"><kbd>Cmd</kbd> + <kbd>Enter</kbd> 快捷格式化</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.json-formatter {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f2f5;
}

/* ---- Toolbar ---- */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.divider-v {
  width: 1px;
  height: 22px;
  background: #e5e7eb;
  margin: 0 2px;
}

.btn {
  padding: 7px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 10px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd6, #6a4193);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-ghost {
  border: none;
  color: #9ca3af;
}

.btn-ghost:hover:not(:disabled) {
  color: #ef4444;
  background: #fef2f2;
}

.select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 12px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  outline: none;
}

.select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
}

.toggle-group {
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}

.toggle-btn {
  padding: 5px 14px;
  border: none;
  background: #fff;
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn:not(:last-child) {
  border-right: 1px solid #d1d5db;
}

.toggle-btn.active {
  background: #667eea;
  color: #fff;
}

.toggle-btn:hover:not(.active):not(:disabled) {
  background: #f9fafb;
  color: #374151;
}

.toggle-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ---- Error ---- */
.error-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  border-bottom: 1px solid #fecaca;
  flex-shrink: 0;
}

.error-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  flex-shrink: 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ---- Editor ---- */
.editor {
  flex: 1;
  display: flex;
  padding: 16px 20px;
  gap: 0;
  min-height: 0;
}

.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  min-width: 0;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.pane-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.pane-meta {
  font-size: 11px;
  color: #b0b7c3;
}

.pane-body {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.editor-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  flex-shrink: 0;
}

.divider-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.divider-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.45);
}

.divider-btn:active {
  transform: scale(0.95);
}

/* ---- Code Input ---- */
.code-input {
  width: 100%;
  height: 100%;
  padding: 16px;
  border: none;
  resize: none;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  outline: none;
  background: #fff;
  color: #1f2937;
}

.code-input::placeholder {
  color: #d1d5db;
}

/* ---- Code Output ---- */
.code-output {
  padding: 16px;
}

.code-output pre {
  margin: 0;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
}

.tree-output {
  padding: 16px;
}

/* ---- Empty State ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  user-select: none;
}

.empty-icon {
  font-size: 36px;
  color: #e5e7eb;
  font-weight: 300;
  font-family: 'SF Mono', Monaco, monospace;
}

.empty-text {
  font-size: 14px;
  color: #b0b7c3;
}

.empty-hint {
  font-size: 12px;
  color: #d1d5db;
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-hint kbd {
  display: inline-block;
  padding: 2px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f9fafb;
  font-family: inherit;
  font-size: 11px;
  color: #9ca3af;
  box-shadow: 0 1px 0 #d1d5db;
}
</style>
