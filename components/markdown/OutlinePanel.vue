<script lang="ts" setup>
import { computed } from 'vue';
import { useMarkdownStore } from '@/stores/markdown';

interface HeadingItem {
  level: number;
  text: string;
  index: number;
}

const store = useMarkdownStore();

const headings = computed<HeadingItem[]>(() => {
  if (!store.activeNote) return [];
  const lines = store.activeNote.content.split('\n');
  const result: HeadingItem[] = [];
  let index = 0;
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      result.push({
        level: match[1].length,
        text: match[2].trim(),
        index: index++,
      });
    }
  }
  return result;
});

function scrollToHeading(heading: HeadingItem) {
  const editorEl = document.querySelector('.milkdown .editor');
  if (!editorEl) return;
  const hTags = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const target = hTags[heading.index];
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
</script>

<template>
  <div class="outline-panel">
    <div class="outline-header">
      <span class="header-title">大纲</span>
    </div>

    <div class="outline-items">
      <div v-if="headings.length === 0" class="empty-hint">
        暂无标题
      </div>

      <button
        v-for="item in headings"
        :key="item.index"
        class="outline-item"
        :class="[`level-${item.level}`]"
        @click="scrollToHeading(item)"
      >
        {{ item.text }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.outline-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
  border-left: 1px solid #e8e8e8;
}

.outline-header {
  padding: 14px 16px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.outline-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-hint {
  text-align: center;
  color: #aaa;
  font-size: 12px;
  padding: 24px 0;
}

.outline-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #555;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outline-item:hover {
  background: #f0f0f0;
  color: #333;
}

.outline-item.level-1 {
  padding-left: 10px;
  font-weight: 600;
  font-size: 13px;
}

.outline-item.level-2 {
  padding-left: 20px;
  font-weight: 500;
}

.outline-item.level-3 {
  padding-left: 30px;
}

.outline-item.level-4 {
  padding-left: 40px;
  color: #888;
}

.outline-item.level-5 {
  padding-left: 50px;
  color: #888;
}

.outline-item.level-6 {
  padding-left: 60px;
  color: #888;
}
</style>
