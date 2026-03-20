<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useCopy } from '@/composables/useCopy';
import { useClipboardStore } from '@/stores/clipboard';

const store = useClipboardStore();
const { copied, copy } = useCopy();
const copiedId = ref('');
const searchQuery = ref('');
const filterType = ref('');

const filtered = computed(() => {
  let list = store.sortedEntries;
  if (filterType.value) {
    list = list.filter(e => e.contentType === filterType.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(e => e.content.toLowerCase().includes(q));
  }
  return list;
});

async function copyEntry(content: string, id: string) {
  copiedId.value = id;
  await copy(content);
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

function truncate(text: string, maxLen = 200): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

const typeLabels: Record<string, string> = {
  code: '代码',
  url: 'URL',
  text: '文本',
  number: '数字',
};

const typeColors: Record<string, string> = {
  code: '#8b5cf6',
  url: '#1a73e8',
  text: '#6b7280',
  number: '#16a34a',
};
</script>

<template>
  <div class="clipboard-history">
    <div class="panel-header">
      <h2 class="panel-title">剪贴板历史</h2>
      <p class="panel-desc">记录复制操作历史，快速搜索和再次复制</p>
    </div>

    <div class="toolbar">
      <input v-model="searchQuery" class="search-input" placeholder="搜索内容..." />
      <select v-model="filterType" class="filter-select">
        <option value="">全部类型</option>
        <option value="code">代码</option>
        <option value="url">URL</option>
        <option value="text">文本</option>
        <option value="number">数字</option>
      </select>
      <button class="btn-outline" @click="store.clearAll()">清空非收藏</button>
    </div>

    <div class="hint-bar">
      提示：剪贴板历史需要 Content Script 注入到页面，当前为手动管理模式。
    </div>

    <div class="entry-list">
      <div v-if="filtered.length === 0" class="empty-hint">暂无记录</div>
      <div v-for="entry in filtered" :key="entry.id" class="entry-card" @click="copyEntry(entry.content, entry.id)">
        <div class="entry-header">
          <span class="type-badge" :style="{ color: typeColors[entry.contentType], borderColor: typeColors[entry.contentType] }">
            {{ typeLabels[entry.contentType] }}
          </span>
          <span class="entry-time">{{ formatTime(entry.createdAt) }}</span>
        </div>
        <pre class="entry-content">{{ truncate(entry.content) }}</pre>
        <div v-if="entry.sourceTitle" class="entry-source">
          来自：{{ entry.sourceTitle }}
        </div>
        <div class="entry-actions">
          <span class="copy-status" v-if="copied && copiedId === entry.id">已复制</span>
          <button class="btn-sm" @click.stop="store.toggleFavorite(entry.id)">
            {{ entry.isFavorite ? '★ 已收藏' : '☆ 收藏' }}
          </button>
          <button class="btn-sm danger" @click.stop="store.removeEntry(entry.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.clipboard-history {
  padding: 28px 32px;
  max-width: 720px;
  overflow-y: auto;
  height: 100%;
}

.panel-header { margin-bottom: 20px; }
.panel-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0; }
.panel-desc { font-size: 13px; color: #9ca3af; margin: 6px 0 0; }

.toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.search-input { flex: 1; min-width: 180px; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #374151; outline: none; }
.search-input:focus { border-color: #1a73e8; }
.filter-select { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #374151; outline: none; cursor: pointer; }
.btn-outline { padding: 8px 14px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 13px; color: #6b7280; cursor: pointer; }
.btn-outline:hover { border-color: #ef4444; color: #ef4444; }

.hint-bar { padding: 8px 12px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; font-size: 12px; color: #92400e; margin-bottom: 14px; }

.entry-list { display: flex; flex-direction: column; gap: 8px; }
.empty-hint { text-align: center; color: #9ca3af; font-size: 13px; padding: 40px 0; }

.entry-card { padding: 10px 14px; border: 1px solid #f3f4f6; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
.entry-card:hover { border-color: #1a73e8; background: #f8faff; }

.entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.type-badge { padding: 1px 6px; border: 1px solid; border-radius: 3px; font-size: 10px; font-weight: 500; }
.entry-time { font-size: 11px; color: #9ca3af; }

.entry-content { margin: 0; padding: 6px 8px; background: #f9fafb; border-radius: 4px; font-size: 12px; font-family: 'SF Mono', Monaco, monospace; color: #374151; white-space: pre-wrap; word-break: break-all; max-height: 80px; overflow: hidden; }

.entry-source { font-size: 11px; color: #9ca3af; margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.entry-actions { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
.copy-status { font-size: 11px; color: #16a34a; font-weight: 500; }
.btn-sm { padding: 3px 8px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; font-size: 11px; color: #6b7280; cursor: pointer; }
.btn-sm:hover { border-color: #1a73e8; color: #1a73e8; }
.btn-sm.danger:hover { border-color: #ef4444; color: #ef4444; }
</style>
