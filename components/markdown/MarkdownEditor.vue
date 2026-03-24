<script lang="ts" setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { MilkdownProvider } from '@milkdown/vue';
import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/vue';
import { useMarkdownStore } from '@/stores/markdown';
import MilkdownEditor from './MilkdownEditor.vue';
import EditorToolbar from './EditorToolbar.vue';
import NoteList from './NoteList.vue';
import OutlinePanel from './OutlinePanel.vue';

const store = useMarkdownStore();

const showNoteList = ref(true);
const showOutline = ref(true);
const editorContent = ref('');
const editorRef = ref<InstanceType<typeof MilkdownEditor> | null>(null);
let switchingNote = false;

// Resizable panel widths
const noteListWidth = ref(220);
const outlineWidth = ref(200);

const NOTE_LIST_MIN = 160;
const NOTE_LIST_MAX = 360;
const OUTLINE_MIN = 140;
const OUTLINE_MAX = 320;

let dragging: 'noteList' | 'outline' | null = null;
let dragStartX = 0;
let dragStartWidth = 0;

function onResizeStart(e: MouseEvent, panel: 'noteList' | 'outline') {
  e.preventDefault();
  dragging = panel;
  dragStartX = e.clientX;
  dragStartWidth = panel === 'noteList' ? noteListWidth.value : outlineWidth.value;
  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function onResizeMove(e: MouseEvent) {
  if (!dragging) return;
  const delta = e.clientX - dragStartX;
  if (dragging === 'noteList') {
    noteListWidth.value = Math.min(NOTE_LIST_MAX, Math.max(NOTE_LIST_MIN, dragStartWidth + delta));
  } else {
    // Outline is on the right, so dragging left increases width
    outlineWidth.value = Math.min(OUTLINE_MAX, Math.max(OUTLINE_MIN, dragStartWidth - delta));
  }
}

function onResizeEnd() {
  dragging = null;
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

onMounted(async () => {
  await store.initPromise;
  if (store.notes.length === 0) {
    store.createNote();
  }
  if (!store.activeNoteId && store.notes.length > 0) {
    store.setActiveNote(store.notes[0].id);
  }
});

watch(
  () => store.activeNote,
  (note, oldNote) => {
    if (note) {
      switchingNote = true;
      editorContent.value = note.content;
      // If editor already exists, update content in-place instead of remounting
      if (oldNote && editorRef.value) {
        nextTick(() => {
          editorRef.value?.replaceContent(note.content);
          switchingNote = false;
        });
      } else {
        nextTick(() => {
          switchingNote = false;
        });
      }
    }
  },
  { immediate: true },
);

function handleContentUpdate(content: string) {
  if (switchingNote) return;
  editorContent.value = content;
  if (store.activeNoteId) {
    store.updateNoteContent(store.activeNoteId, content);
  }
}
</script>

<template>
  <div class="markdown-editor">
    <EditorToolbar />

    <div class="editor-body">
      <!-- Note list sidebar -->
      <div
        v-if="showNoteList"
        class="sidebar-panel"
        :style="{ width: noteListWidth + 'px' }"
      >
        <NoteList />
      </div>

      <!-- Left resize handle -->
      <div
        v-if="showNoteList"
        class="resize-handle"
        @mousedown="onResizeStart($event, 'noteList')"
      >
        <div class="resize-line" />
      </div>

      <!-- Main editor area -->
      <div class="editor-main">
        <div v-if="!store.activeNote" class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">选择或新建一篇笔记开始编辑</div>
        </div>

        <MilkdownProvider v-else>
          <ProsemirrorAdapterProvider>
            <MilkdownEditor
              ref="editorRef"
              :model-value="editorContent"
              @update:model-value="handleContentUpdate"
            />
          </ProsemirrorAdapterProvider>
        </MilkdownProvider>
      </div>

      <!-- Right resize handle -->
      <div
        v-if="showOutline"
        class="resize-handle"
        @mousedown="onResizeStart($event, 'outline')"
      >
        <div class="resize-line" />
      </div>

      <!-- Outline panel -->
      <div
        v-if="showOutline"
        class="sidebar-panel"
        :style="{ width: outlineWidth + 'px' }"
      >
        <OutlinePanel />
      </div>
    </div>

    <!-- Toggle buttons -->
    <div class="toggle-buttons">
      <button
        class="toggle-btn"
        :class="{ active: showNoteList }"
        title="切换笔记列表"
        @click="showNoteList = !showNoteList"
      >☰</button>
      <button
        class="toggle-btn"
        :class="{ active: showOutline }"
        title="切换大纲"
        @click="showOutline = !showOutline"
      >¶</button>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background: #fff;
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-panel {
  flex-shrink: 0;
  overflow: hidden;
}

.editor-main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Resize handle */
.resize-handle {
  width: 6px;
  flex-shrink: 0;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.resize-handle:hover .resize-line,
.resize-handle:active .resize-line {
  background: #667eea;
  opacity: 0.5;
}

.resize-line {
  width: 2px;
  height: 100%;
  background: #e0e0e0;
  border-radius: 1px;
  transition: background 0.15s, opacity 0.15s;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #aaa;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 15px;
}

.toggle-buttons {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 6px;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.toggle-btn:hover {
  border-color: #ccc;
  color: #666;
}

.toggle-btn.active {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}
</style>
