<script lang="ts" setup>
import { ref } from 'vue';
import UrlCodec from './UrlCodec.vue';
import Base64Codec from './Base64Codec.vue';
import HtmlCodec from './HtmlCodec.vue';
import UnicodeCodec from './UnicodeCodec.vue';

type TabKey = 'url' | 'base64' | 'html' | 'unicode';

const activeTab = ref<TabKey>('url');

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'url', label: 'URL' },
  { key: 'base64', label: 'Base64' },
  { key: 'html', label: 'HTML' },
  { key: 'unicode', label: 'Unicode' },
];
</script>

<template>
  <div class="encode-decode">
    <div class="panel-header">
      <h2 class="panel-title">编码 / 解码</h2>
      <p class="panel-desc">URL、Base64、HTML 实体、Unicode 双向转换</p>
    </div>

    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content">
      <UrlCodec v-if="activeTab === 'url'" />
      <Base64Codec v-else-if="activeTab === 'base64'" />
      <HtmlCodec v-else-if="activeTab === 'html'" />
      <UnicodeCodec v-else-if="activeTab === 'unicode'" />
    </div>
  </div>
</template>

<style scoped>
.encode-decode {
  padding: 28px 32px;
  max-width: 900px;
  overflow-y: auto;
  height: 100%;
}

.panel-header {
  margin-bottom: 20px;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.panel-desc {
  font-size: 13px;
  color: #9ca3af;
  margin: 6px 0 0;
}

.tab-bar {
  display: flex;
  gap: 4px;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 3px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #6b7280;
  transition: all 0.15s;
}

.tab-btn.active {
  background: #fff;
  color: #1a73e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.tab-btn:hover:not(.active) {
  color: #374151;
}

.tab-content {
  min-height: 0;
}
</style>
