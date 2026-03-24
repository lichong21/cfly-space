<script lang="ts" setup>
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
      <button class="tool-item" @click="openOptions('json')">
        <span class="tool-icon">{ }</span>
        <span class="tool-label">JSON 格式化</span>
        <span class="tool-arrow">›</span>
      </button>
      <button class="tool-item" @click="openOptions('markdown')">
        <span class="tool-icon">📝</span>
        <span class="tool-label">Markdown 编辑器</span>
        <span class="tool-arrow">›</span>
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

.tool-item:hover {
  background: #f0f4ff;
  border-color: #1a73e8;
}

.tool-icon {
  font-size: 18px;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.tool-label {
  flex: 1;
  color: #374151;
  font-weight: 500;
}

.tool-arrow {
  color: #9ca3af;
  font-size: 16px;
}
</style>
