<script lang="ts" setup>
import { ref } from 'vue';
import UuidPanel from './UuidPanel.vue';
import RandomStringPanel from './RandomStringPanel.vue';
import RandomNumberPanel from './RandomNumberPanel.vue';
import MockDataPanel from './MockDataPanel.vue';

type TabKey = 'uuid' | 'string' | 'number' | 'mock';

const activeTab = ref<TabKey>('uuid');

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'uuid', label: 'UUID' },
  { key: 'string', label: '随机字符串' },
  { key: 'number', label: '随机数字' },
  { key: 'mock', label: 'Mock 数据' },
];
</script>

<template>
  <div class="uuid-generator">
    <div class="panel-header">
      <h2 class="panel-title">UUID / 随机数据生成器</h2>
      <p class="panel-desc">UUID、随机字符串、随机数字、Mock 数据一键生成</p>
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
      <UuidPanel v-if="activeTab === 'uuid'" />
      <RandomStringPanel v-else-if="activeTab === 'string'" />
      <RandomNumberPanel v-else-if="activeTab === 'number'" />
      <MockDataPanel v-else-if="activeTab === 'mock'" />
    </div>
  </div>
</template>

<style scoped>
.uuid-generator {
  padding: 28px 32px;
  max-width: 900px;
  overflow-y: auto;
  height: 100%;
}

.panel-header { margin-bottom: 20px; }
.panel-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0; }
.panel-desc { font-size: 13px; color: #9ca3af; margin: 6px 0 0; }

.tab-bar { display: flex; gap: 4px; background: #f3f4f6; border-radius: 8px; padding: 3px; margin-bottom: 16px; }
.tab-btn { flex: 1; padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; background: transparent; color: #6b7280; transition: all 0.15s; }
.tab-btn.active { background: #fff; color: #1a73e8; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.tab-btn:hover:not(.active) { color: #374151; }
</style>
