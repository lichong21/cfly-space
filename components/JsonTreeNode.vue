<script lang="ts" setup>
import { ref } from 'vue';
import type { JsonTreeNodeData } from '@/types';

const props = defineProps<{
  node: JsonTreeNodeData;
  depth?: number;
}>();

const collapsed = ref(false);
const depth = props.depth ?? 0;
const indent = depth * 20;

const hasChildren = !!props.node.children && props.node.children.length > 0;

function toggle() {
  if (hasChildren) {
    collapsed.value = !collapsed.value;
  }
}

function formatValue(value: unknown, type: string): string {
  if (type === 'string') return `"${value}"`;
  if (type === 'null') return 'null';
  return String(value);
}
</script>

<template>
  <div class="node-row" :style="{ paddingLeft: `${indent}px` }" @click="toggle">
    <span v-if="hasChildren" class="toggle-btn" :class="{ collapsed }">
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M3 1.5 L7 5 L3 8.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
    <span v-else class="toggle-placeholder" />

    <span class="json-key">"{{ node.key }}"</span>
    <span class="colon">: </span>

    <template v-if="hasChildren">
      <span class="bracket">{{ node.type === 'array' ? '[' : '{' }}</span>
      <span v-if="collapsed" class="collapsed-hint">
        <span class="collapsed-count">{{ node.length }}</span>
        {{ node.length === 1 ? 'item' : 'items' }}
        {{ node.type === 'array' ? ']' : '}' }}
      </span>
    </template>
    <template v-else>
      <span :class="`json-${node.type}`">
        {{ formatValue(node.value, node.type) }}
      </span>
    </template>
  </div>

  <template v-if="hasChildren && !collapsed">
    <JsonTreeNode
      v-for="(child, i) in node.children"
      :key="i"
      :node="child"
      :depth="depth + 1"
    />
    <div class="node-row" :style="{ paddingLeft: `${indent}px` }">
      <span class="toggle-placeholder" />
      <span class="bracket">{{ node.type === 'array' ? ']' : '}' }}</span>
    </div>
  </template>
</template>

<style scoped>
.node-row {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.8;
  white-space: nowrap;
  cursor: default;
  border-radius: 4px;
  padding-right: 8px;
}

.node-row:has(.toggle-btn) {
  cursor: pointer;
}

.node-row:has(.toggle-btn):hover {
  background: rgba(102, 126, 234, 0.06);
}

.node-row:has(.toggle-btn):hover .toggle-btn {
  background: rgba(102, 126, 234, 0.12);
  color: #667eea;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  color: #b0b7c3;
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
  margin-right: 2px;
  transition: all 0.15s ease;
}

.toggle-btn svg {
  transition: transform 0.15s ease;
}

.toggle-btn:not(.collapsed) svg {
  transform: rotate(90deg);
}

.toggle-placeholder {
  display: inline-block;
  width: 20px;
}

.colon {
  color: #9ca3af;
}

.bracket {
  color: #9ca3af;
}

.collapsed-hint {
  color: #b0b7c3;
  font-size: 12px;
  margin-left: 4px;
}

.collapsed-count {
  display: inline-block;
  padding: 0 5px;
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  margin-right: 2px;
}
</style>
