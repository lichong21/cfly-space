<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useCopy } from '@/composables/useCopy';
import { useSnippetStore } from '@/stores/snippet';
import type { Snippet } from '@/types/snippet';
import { DEFAULT_FOLDER_ID } from '@/types/snippet';
import SnippetEditor from './SnippetEditor.vue';

const store = useSnippetStore();
const { copied, copy } = useCopy();
const copiedId = ref('');

const searchQuery = ref('');
const filterFolder = ref(DEFAULT_FOLDER_ID);
const filterLanguage = ref('');
const filterTag = ref('');
const showEditor = ref(false);
const editingSnippet = ref<Snippet | null>(null);
const newFolderName = ref('');
const deleteConfirmId = ref('');

const filtered = computed(() => {
  let list = store.sortedSnippets;

  if (filterFolder.value !== DEFAULT_FOLDER_ID) {
    list = list.filter(s => s.folderId === filterFolder.value);
  }
  if (filterLanguage.value) {
    list = list.filter(s => s.language === filterLanguage.value);
  }
  if (filterTag.value) {
    list = list.filter(s => s.tags.includes(filterTag.value));
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q)),
    );
  }
  return list;
});

function openCreate() {
  editingSnippet.value = null;
  showEditor.value = true;
}

function openEdit(s: Snippet) {
  editingSnippet.value = s;
  showEditor.value = true;
}

function handleSaved() {
  showEditor.value = false;
  editingSnippet.value = null;
}

function confirmDelete(id: string) {
  if (deleteConfirmId.value === id) {
    store.deleteSnippet(id);
    deleteConfirmId.value = '';
  } else {
    deleteConfirmId.value = id;
    setTimeout(() => { deleteConfirmId.value = ''; }, 3000);
  }
}

async function copyCode(code: string, id: string) {
  copiedId.value = id;
  await copy(code);
}

function addFolder() {
  if (!newFolderName.value.trim()) return;
  store.addFolder(newFolderName.value.trim());
  newFolderName.value = '';
}

function handleExport() {
  const data = store.exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'snippets.json';
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.importData(reader.result as string);
      } catch {
        // silently fail
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function previewCode(code: string): string {
  return code.split('\n').slice(0, 5).join('\n');
}

function getFolderName(id: string): string {
  if (id === DEFAULT_FOLDER_ID) return '未分组';
  return store.folders.find(f => f.id === id)?.name ?? '未分组';
}
</script>

<template>
  <div class="snippet-manager">
    <div class="panel-header">
      <h2 class="panel-title">代码片段管理</h2>
      <p class="panel-desc">收藏和管理常用代码片段，支持搜索、分类和标签</p>
    </div>

    <!-- Editor Overlay -->
    <div v-if="showEditor" class="editor-overlay">
      <div class="editor-card">
        <SnippetEditor
          :snippet="editingSnippet"
          @saved="handleSaved"
          @cancel="showEditor = false"
        />
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <input v-model="searchQuery" class="search-input" placeholder="搜索标题、代码、标签..." />
      <select v-model="filterLanguage" class="filter-select">
        <option value="">全部语言</option>
        <option v-for="lang in [...new Set(store.snippets.map(s => s.language))]" :key="lang" :value="lang">{{ lang }}</option>
      </select>
      <select v-model="filterTag" class="filter-select">
        <option value="">全部标签</option>
        <option v-for="tag in store.allTags" :key="tag" :value="tag">{{ tag }}</option>
      </select>
      <button class="btn-primary" @click="openCreate">新建</button>
      <button class="btn-sm" @click="handleExport">导出</button>
      <button class="btn-sm" @click="handleImport">导入</button>
    </div>

    <!-- Sidebar + Content -->
    <div class="body">
      <!-- Folder Sidebar -->
      <div class="sidebar">
        <div class="sidebar-title">文件夹</div>
        <button
          class="folder-item"
          :class="{ active: filterFolder === DEFAULT_FOLDER_ID }"
          @click="filterFolder = DEFAULT_FOLDER_ID"
        >
          全部 ({{ store.snippets.length }})
        </button>
        <button
          v-for="f in store.folders"
          :key="f.id"
          class="folder-item"
          :class="{ active: filterFolder === f.id }"
          @click="filterFolder = f.id"
        >
          {{ f.name }} ({{ store.snippets.filter(s => s.folderId === f.id).length }})
          <span class="folder-del" @click.stop="store.removeFolder(f.id)">&times;</span>
        </button>
        <div class="add-folder">
          <input v-model="newFolderName" class="add-input" placeholder="新建文件夹" @keydown.enter="addFolder" />
        </div>
      </div>

      <!-- Snippet List -->
      <div class="list">
        <div v-if="filtered.length === 0" class="empty-hint">暂无片段</div>
        <div v-for="s in filtered" :key="s.id" class="snippet-card">
          <div class="card-header">
            <span class="card-title">{{ s.title }}</span>
            <div class="card-meta">
              <span class="lang-badge">{{ s.language }}</span>
              <span v-if="s.isFavorite" class="fav-icon">★</span>
            </div>
          </div>
          <pre class="card-code">{{ previewCode(s.code) }}</pre>
          <div class="card-tags" v-if="s.tags.length > 0">
            <span v-for="tag in s.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="card-footer">
            <span class="card-folder">{{ getFolderName(s.folderId) }}</span>
            <div class="card-actions">
              <button class="btn-sm" @click="copyCode(s.code, s.id)">
                {{ copied && copiedId === s.id ? '已复制' : '复制' }}
              </button>
              <button class="btn-sm" @click="store.toggleFavorite(s.id)">
                {{ s.isFavorite ? '取消收藏' : '收藏' }}
              </button>
              <button class="btn-sm" @click="openEdit(s)">编辑</button>
              <button class="btn-sm danger" @click="confirmDelete(s.id)">
                {{ deleteConfirmId === s.id ? '确认删除?' : '删除' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snippet-manager {
  padding: 28px 32px;
  max-width: 960px;
  overflow-y: auto;
  height: 100%;
  position: relative;
}

.panel-header { margin-bottom: 20px; }
.panel-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0; }
.panel-desc { font-size: 13px; color: #9ca3af; margin: 6px 0 0; }

.toolbar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.search-input { flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #374151; outline: none; }
.search-input:focus { border-color: #1a73e8; }
.filter-select { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #374151; outline: none; cursor: pointer; }
.btn-primary { padding: 8px 16px; border: none; border-radius: 6px; background: #1a73e8; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-primary:hover { background: #1557b0; }
.btn-sm { padding: 4px 10px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; font-size: 11px; color: #6b7280; cursor: pointer; }
.btn-sm:hover { border-color: #1a73e8; color: #1a73e8; }
.btn-sm.danger:hover { border-color: #ef4444; color: #ef4444; }

.body { display: flex; gap: 16px; }

/* Sidebar */
.sidebar { width: 160px; flex-shrink: 0; }
.sidebar-title { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.folder-item { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 6px 10px; border: none; border-radius: 6px; background: transparent; font-size: 12px; color: #6b7280; cursor: pointer; text-align: left; margin-bottom: 2px; }
.folder-item:hover { background: #f3f4f6; }
.folder-item.active { background: #e0f2fe; color: #0369a1; }
.folder-del { color: #9ca3af; font-size: 14px; display: none; }
.folder-item:hover .folder-del { display: inline; }
.folder-del:hover { color: #ef4444; }
.add-folder { margin-top: 8px; }
.add-input { width: 100%; padding: 4px 8px; border: 1px dashed #d1d5db; border-radius: 4px; font-size: 11px; outline: none; box-sizing: border-box; }
.add-input:focus { border-color: #1a73e8; }

/* List */
.list { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.empty-hint { text-align: center; color: #9ca3af; font-size: 13px; padding: 40px 0; }

.snippet-card { border: 1px solid #f3f4f6; border-radius: 8px; padding: 12px; background: #fff; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-title { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.card-meta { display: flex; align-items: center; gap: 6px; }
.lang-badge { padding: 2px 6px; background: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280; font-weight: 500; }
.fav-icon { color: #f59e0b; font-size: 14px; }
.card-code { margin: 0; padding: 8px 10px; background: #f9fafb; border-radius: 6px; font-size: 12px; font-family: 'SF Mono', Monaco, monospace; color: #374151; overflow: hidden; max-height: 100px; white-space: pre-wrap; word-break: break-all; }
.card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.tag { padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 3px; font-size: 10px; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.card-folder { font-size: 11px; color: #9ca3af; }
.card-actions { display: flex; gap: 4px; }

/* Editor Overlay */
.editor-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: flex-start; justify-content: center; padding-top: 40px; z-index: 10; }
.editor-card { background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); width: 600px; max-height: 80vh; overflow-y: auto; }
</style>
