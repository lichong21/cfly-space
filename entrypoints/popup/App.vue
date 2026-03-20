<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import type { WaterStatus } from '@/types/water';

const tools = [
  { key: 'json', label: 'JSON 格式化', icon: '{ }', ready: true },
  { key: 'timestamp', label: '时间戳转换', icon: '⏱', ready: true },
  { key: 'encode', label: '编码 / 解码', icon: '🔄', ready: true },
  { key: 'regex', label: '正则测试器', icon: '.*', ready: true },
  { key: 'uuid', label: 'UUID / 随机', icon: '🎲', ready: true },
  { key: 'diff', label: 'Diff 对比', icon: '⇄', ready: true },
  { key: 'color', label: '颜色工具', icon: '🎨', ready: true },
  { key: 'snippet', label: '代码片段', icon: '✂', ready: true },
  { key: 'httpstatus', label: 'HTTP 状态码', icon: '🌐', ready: true },
  { key: 'ruler', label: '页面标尺', icon: '📐', ready: true },
  { key: 'water', label: '喝水提醒', icon: '💧', ready: true },
];

const waterStatus = ref<WaterStatus | null>(null);

onMounted(async () => {
  try {
    const status = await chrome.runtime.sendMessage({ type: 'water', action: 'getStatus' });
    if (status && status.enabled !== undefined) {
      waterStatus.value = status;
    }
  } catch {
    // background not ready
  }
});

function formatCountdown(time: number | null): string {
  if (!time) return '';
  const remaining = time - Date.now();
  if (remaining <= 0) return '即将提醒';
  const min = Math.floor(remaining / 60000);
  if (min > 0) return `${min} 分钟后`;
  return '不到 1 分钟';
}

function openOptions(tab: string) {
  const url = browser.runtime.getURL(`/options.html#${tab}`);
  browser.tabs.create({ url });
  window.close();
}
</script>

<template>
  <div class="popup">
    <div class="header">
      <h1 class="title">CFly Space</h1>
      <p class="subtitle">办公辅助工具箱</p>
    </div>
    <div class="tool-list">
      <button
        v-for="tool in tools"
        :key="tool.key"
        class="tool-item"
        :class="{ disabled: !tool.ready }"
        :disabled="!tool.ready"
        @click="openOptions(tool.key)"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <div class="tool-info">
          <span class="tool-label">{{ tool.label }}</span>
          <span
            v-if="tool.key === 'water' && waterStatus?.enabled"
            class="tool-summary"
          >
            {{ formatCountdown(waterStatus.nextAlarmTime) }} · 今日 {{ waterStatus.todayCount }} 次
          </span>
        </div>
        <span v-if="!tool.ready" class="tool-badge">即将推出</span>
        <span v-else class="tool-arrow">›</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.popup {
  width: 280px;
  padding: 16px;
}

.header {
  margin-bottom: 12px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin: 4px 0 0;
}

.tool-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-size: 13px;
}

.tool-item:hover:not(.disabled) {
  background: #f0f4ff;
  border-color: #1a73e8;
}

.tool-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-icon {
  font-size: 18px;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.tool-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tool-label {
  color: #374151;
  font-weight: 500;
}

.tool-summary {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.tool-badge {
  font-size: 10px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.tool-arrow {
  color: #9ca3af;
  font-size: 16px;
}
</style>
