<script lang="ts" setup>
const props = defineProps<{
  activeTab: string;
}>();

const emit = defineEmits<{
  (e: 'update:activeTab', tab: string): void;
}>();

const tabs = [
  { key: 'json', label: 'JSON 格式化' },
  { key: 'timestamp', label: '时间戳转换' },
  { key: 'water', label: '喝水提醒' },
];
</script>

<template>
  <div class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: props.activeTab === tab.key }"
      :disabled="tab.key !== 'json'"
      @click="emit('update:activeTab', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}

.tab-item {
  flex: 1;
  padding: 10px 8px;
  border: none;
  background: none;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-item:hover:not(:disabled) {
  color: #1a73e8;
  background: #eff6ff;
}

.tab-item.active {
  color: #1a73e8;
  border-bottom-color: #1a73e8;
  font-weight: 600;
}

.tab-item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
