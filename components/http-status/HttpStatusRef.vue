<script lang="ts" setup>
import { ref, computed } from 'vue';
import { HTTP_STATUS_CODES, CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/httpStatus';

const searchQuery = ref('');
const filterCategory = ref('');
const expandedCode = ref<number | null>(null);

const categories = ['1xx', '2xx', '3xx', '4xx', '5xx'] as const;

const filtered = computed(() => {
  let list = HTTP_STATUS_CODES;
  if (filterCategory.value) {
    list = list.filter(c => c.category === filterCategory.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(c =>
      String(c.code).includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q),
    );
  }
  return list;
});

function toggleExpand(code: number) {
  expandedCode.value = expandedCode.value === code ? null : code;
}
</script>

<template>
  <div class="http-status">
    <div class="panel-header">
      <h2 class="panel-title">HTTP 状态码速查</h2>
      <p class="panel-desc">全量 HTTP 状态码查询，含使用场景和排查建议</p>
    </div>

    <div class="toolbar">
      <input v-model="searchQuery" class="search-input" placeholder="搜索状态码或关键词，如 404 或 not found" />
      <div class="category-btns">
        <button
          class="cat-btn"
          :class="{ active: !filterCategory }"
          @click="filterCategory = ''"
        >
          All
        </button>
        <button
          v-for="cat in categories"
          :key="cat"
          class="cat-btn"
          :class="{ active: filterCategory === cat }"
          :style="{ '--cat-color': CATEGORY_COLORS[cat] } as any"
          @click="filterCategory = filterCategory === cat ? '' : cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <div class="card-list">
      <div
        v-for="item in filtered"
        :key="item.code"
        class="status-card"
        :class="{ expanded: expandedCode === item.code }"
        @click="toggleExpand(item.code)"
      >
        <div class="card-main">
          <span
            class="code-badge"
            :style="{ background: CATEGORY_COLORS[item.category] + '18', color: CATEGORY_COLORS[item.category], borderColor: CATEGORY_COLORS[item.category] + '40' }"
          >
            {{ item.code }}
          </span>
          <div class="card-info">
            <span class="card-name">{{ item.name }}</span>
            <span class="card-desc">{{ item.description }}</span>
          </div>
          <span class="expand-icon" :class="{ open: expandedCode === item.code }">▶</span>
        </div>

        <div v-if="expandedCode === item.code" class="card-detail" @click.stop>
          <div class="detail-item">
            <span class="detail-label">使用场景</span>
            <span class="detail-value">{{ item.scenario }}</span>
          </div>
          <div v-if="item.cause" class="detail-item">
            <span class="detail-label">常见原因</span>
            <span class="detail-value">{{ item.cause }}</span>
          </div>
          <div v-if="item.fix" class="detail-item">
            <span class="detail-label">排查建议</span>
            <span class="detail-value">{{ item.fix }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.http-status {
  padding: 28px 32px;
  max-width: 720px;
  overflow-y: auto;
  height: 100%;
}

.panel-header { margin-bottom: 20px; }
.panel-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0; }
.panel-desc { font-size: 13px; color: #9ca3af; margin: 6px 0 0; }

.toolbar { margin-bottom: 16px; }
.search-input { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; color: #374151; outline: none; margin-bottom: 10px; box-sizing: border-box; }
.search-input:focus { border-color: #1a73e8; }

.category-btns { display: flex; gap: 4px; }
.cat-btn { padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 12px; font-weight: 600; color: #6b7280; cursor: pointer; transition: all 0.15s; }
.cat-btn:hover { border-color: var(--cat-color, #1a73e8); color: var(--cat-color, #1a73e8); }
.cat-btn.active { background: var(--cat-color, #1a73e8); border-color: var(--cat-color, #1a73e8); color: #fff; }

.card-list { display: flex; flex-direction: column; gap: 6px; }

.status-card { border: 1px solid #f3f4f6; border-radius: 8px; cursor: pointer; transition: all 0.15s; overflow: hidden; }
.status-card:hover { border-color: #e5e7eb; }

.card-main { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }

.code-badge { padding: 4px 10px; border-radius: 6px; font-size: 16px; font-weight: 700; font-family: 'SF Mono', Monaco, monospace; border: 1px solid; flex-shrink: 0; min-width: 50px; text-align: center; }

.card-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.card-name { font-size: 14px; font-weight: 600; color: #374151; }
.card-desc { font-size: 12px; color: #9ca3af; }

.expand-icon { font-size: 10px; color: #9ca3af; transition: transform 0.2s; flex-shrink: 0; }
.expand-icon.open { transform: rotate(90deg); }

.card-detail { padding: 0 14px 14px; border-top: 1px solid #f3f4f6; padding-top: 12px; }
.detail-item { margin-bottom: 8px; }
.detail-item:last-child { margin-bottom: 0; }
.detail-label { font-size: 11px; font-weight: 600; color: #6b7280; display: block; margin-bottom: 2px; }
.detail-value { font-size: 13px; color: #374151; }
</style>
