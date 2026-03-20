<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useCopy } from '@/composables/useCopy';
import { computeDiff, computeStats } from '@/composables/useDiff';
import DiffView from './DiffView.vue';

const { copied, copy } = useCopy();

const oldText = ref('');
const newText = ref('');
const viewMode = ref<'side' | 'inline'>('side');
const onlyDiff = ref(false);
const contextLines = ref(3);
const jsonMode = ref(false);

const processedOld = computed(() => {
  if (!jsonMode.value) return oldText.value;
  try {
    return JSON.stringify(JSON.parse(oldText.value), null, 2);
  } catch {
    return oldText.value;
  }
});

const processedNew = computed(() => {
  if (!jsonMode.value) return newText.value;
  try {
    return JSON.stringify(JSON.parse(newText.value), null, 2);
  } catch {
    return newText.value;
  }
});

const diffs = computed(() => {
  if (!processedOld.value && !processedNew.value) return [];
  return computeDiff(processedOld.value, processedNew.value);
});

const stats = computed(() => computeStats(diffs.value));

function swap() {
  const tmp = oldText.value;
  oldText.value = newText.value;
  newText.value = tmp;
}

function clear() {
  oldText.value = '';
  newText.value = '';
}

function copyDiff() {
  const lines = diffs.value.map(d => {
    const prefix = d.type === 'add' ? '+' : d.type === 'remove' ? '-' : ' ';
    return `${prefix} ${d.text}`;
  });
  copy(lines.join('\n'));
}
</script>

<template>
  <div class="diff-tool">
    <div class="panel-header">
      <h2 class="panel-title">Diff 对比工具</h2>
      <p class="panel-desc">文本差异对比，支持并排/内联视图和 JSON 格式化对比</p>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="mode-switch">
          <button class="mode-btn" :class="{ active: viewMode === 'side' }" @click="viewMode = 'side'">并排</button>
          <button class="mode-btn" :class="{ active: viewMode === 'inline' }" @click="viewMode = 'inline'">内联</button>
        </div>
        <label class="check">
          <input type="checkbox" v-model="jsonMode" />
          <span>JSON 模式</span>
        </label>
        <label class="check">
          <input type="checkbox" v-model="onlyDiff" />
          <span>仅差异</span>
        </label>
      </div>
      <div class="toolbar-right">
        <div v-if="diffs.length > 0" class="stats">
          <span class="stat add">+{{ stats.added }}</span>
          <span class="stat remove">-{{ stats.removed }}</span>
        </div>
        <button class="btn-sm" @click="swap">交换</button>
        <button class="btn-sm" @click="clear">清空</button>
        <button class="btn-sm" @click="copyDiff" :disabled="diffs.length === 0">
          {{ copied ? '已复制' : '复制差异' }}
        </button>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <div class="input-col">
        <div class="col-label">原始文本</div>
        <textarea v-model="oldText" class="diff-textarea" placeholder="粘贴原始文本..." rows="8" />
      </div>
      <div class="input-col">
        <div class="col-label">对比文本</div>
        <textarea v-model="newText" class="diff-textarea" placeholder="粘贴对比文本..." rows="8" />
      </div>
    </div>

    <!-- Diff Result -->
    <div v-if="diffs.length > 0" class="diff-result">
      <DiffView
        :diffs="diffs"
        :view-mode="viewMode"
        :only-diff="onlyDiff"
        :context-lines="contextLines"
      />
    </div>
  </div>
</template>

<style scoped>
.diff-tool {
  padding: 28px 32px;
  max-width: 960px;
  overflow-y: auto;
  height: 100%;
}

.panel-header { margin-bottom: 20px; }
.panel-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0; }
.panel-desc { font-size: 13px; color: #9ca3af; margin: 6px 0 0; }

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-switch { display: flex; background: #f3f4f6; border-radius: 6px; padding: 2px; }
.mode-btn { padding: 4px 12px; border: none; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; background: transparent; color: #6b7280; transition: all 0.15s; }
.mode-btn.active { background: #fff; color: #1a73e8; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }

.check { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #374151; cursor: pointer; }

.stats { display: flex; gap: 6px; font-size: 12px; font-weight: 600; font-family: 'SF Mono', Monaco, monospace; }
.stat.add { color: #16a34a; }
.stat.remove { color: #dc2626; }

.btn-sm { padding: 4px 10px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; font-size: 11px; color: #6b7280; cursor: pointer; }
.btn-sm:hover:not(:disabled) { border-color: #1a73e8; color: #1a73e8; }
.btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }

.input-area { display: flex; gap: 12px; margin-bottom: 16px; }
.input-col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.col-label { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 6px; }

.diff-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, monospace;
  color: #374151;
  outline: none;
  resize: vertical;
  min-height: 150px;
  box-sizing: border-box;
}

.diff-textarea:focus { border-color: #1a73e8; }

.diff-result { margin-top: 4px; }
</style>
