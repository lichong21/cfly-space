<script lang="ts" setup>
import { computed } from 'vue';
import { useMarkdownExport } from '@/composables/useMarkdownExport';
import { useMarkdownFile } from '@/composables/useMarkdownFile';
import { useMarkdownStore } from '@/stores/markdown';

const store = useMarkdownStore();
const { copied, copyMarkdown, exportMarkdown, exportHtml } = useMarkdownExport();
const { openFile, saveFile, saveFileAs, fileName } = useMarkdownFile();

const wordCount = computed(() => {
  if (!store.activeNote) return 0;
  return store.activeNote.content.replace(/\s+/g, '').length;
});

const charCount = computed(() => {
  if (!store.activeNote) return 0;
  return store.activeNote.content.length;
});

async function handleOpen() {
  const result = await openFile();
  if (result) {
    const title = result.name.replace(/\.(md|markdown)$/, '');
    store.createNote(title, result.content);
  }
}

async function handleSave() {
  if (!store.activeNote) return;
  await saveFile(store.activeNote.content);
}

async function handleSaveAs() {
  if (!store.activeNote) return;
  await saveFileAs(store.activeNote.content, `${store.activeNote.title}.md`);
}

function handleCopy() {
  if (!store.activeNote) return;
  copyMarkdown(store.activeNote.content);
}

function handleExportMd() {
  if (!store.activeNote) return;
  exportMarkdown(store.activeNote.content, store.activeNote.title);
}

function handleExportHtml() {
  if (!store.activeNote) return;
  const editorEl = document.querySelector('.milkdown .editor');
  const html = editorEl?.innerHTML || '';
  exportHtml(html, store.activeNote.title);
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <button class="toolbar-btn" title="打开文件" @click="handleOpen">
        <span class="toolbar-icon">📂</span>
        <span class="toolbar-text">打开</span>
      </button>
      <button class="toolbar-btn" title="保存文件" :disabled="!store.activeNote" @click="handleSave">
        <span class="toolbar-icon">💾</span>
        <span class="toolbar-text">保存</span>
      </button>
      <button class="toolbar-btn" title="另存为" :disabled="!store.activeNote" @click="handleSaveAs">
        <span class="toolbar-icon">📄</span>
        <span class="toolbar-text">另存为</span>
      </button>

      <div class="toolbar-divider" />

      <button class="toolbar-btn" title="复制 Markdown" :disabled="!store.activeNote" @click="handleCopy">
        <span class="toolbar-icon">📋</span>
        <span class="toolbar-text">{{ copied ? '已复制' : '复制' }}</span>
      </button>
      <button class="toolbar-btn" title="导出 .md" :disabled="!store.activeNote" @click="handleExportMd">
        <span class="toolbar-icon">⬇</span>
        <span class="toolbar-text">导出 MD</span>
      </button>
      <button class="toolbar-btn" title="导出 .html" :disabled="!store.activeNote" @click="handleExportHtml">
        <span class="toolbar-icon">🌐</span>
        <span class="toolbar-text">导出 HTML</span>
      </button>
    </div>

    <div class="toolbar-right">
      <span v-if="fileName" class="file-name" :title="fileName">{{ fileName }}</span>
      <span v-if="store.activeNote" class="word-count">{{ wordCount }} 字 / {{ charCount }} 字符</span>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #555;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f0f0f0;
  color: #333;
}

.toolbar-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.toolbar-icon {
  font-size: 14px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e0e0e0;
  margin: 0 6px;
}

.file-name {
  font-size: 11px;
  color: #999;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.word-count {
  font-size: 11px;
  color: #aaa;
  white-space: nowrap;
}
</style>
