<script lang="ts" setup>
import { ref } from 'vue';
import { useMarkdownStore } from '@/stores/markdown';

const store = useMarkdownStore();

const deletingId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const editTitle = ref('');

function handleCreate() {
  store.createNote();
}

function handleSelect(id: string) {
  store.setActiveNote(id);
}

function startRename(id: string, title: string) {
  editingId.value = id;
  editTitle.value = title;
}

function confirmRename() {
  if (editingId.value && editTitle.value.trim()) {
    store.updateNoteTitle(editingId.value, editTitle.value.trim());
  }
  editingId.value = null;
}

function handleDelete(id: string) {
  deletingId.value = id;
}

function confirmDelete() {
  if (deletingId.value) {
    store.deleteNote(deletingId.value);
    deletingId.value = null;
  }
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${min}`;
}
</script>

<template>
  <div class="note-list">
    <div class="note-list-header">
      <span class="header-title">笔记</span>
      <button class="create-btn" title="新建笔记" @click="handleCreate">+</button>
    </div>

    <div class="note-items">
      <div v-if="store.sortedNotes.length === 0" class="empty-hint">
        暂无笔记，点击 + 创建
      </div>

      <div
        v-for="note in store.sortedNotes"
        :key="note.id"
        class="note-item"
        :class="{ active: store.activeNoteId === note.id }"
        @click="handleSelect(note.id)"
      >
        <div v-if="editingId === note.id" class="note-edit" @click.stop>
          <input
            v-model="editTitle"
            class="rename-input"
            @keyup.enter="confirmRename"
            @blur="confirmRename"
            @vue:mounted="($event: any) => $event.el.focus()"
          />
        </div>
        <template v-else>
          <div class="note-title">{{ note.title }}</div>
          <div class="note-meta">
            <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
            <div class="note-actions" @click.stop>
              <button class="action-btn" title="重命名" @click="startRename(note.id, note.title)">✏️</button>
              <button class="action-btn delete" title="删除" @click="handleDelete(note.id)">🗑</button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Delete confirm dialog -->
    <Teleport to="body">
      <div v-if="deletingId" class="modal-overlay" @click="deletingId = null">
        <div class="modal-dialog" @click.stop>
          <div class="modal-title">确认删除</div>
          <div class="modal-body">确定要删除这篇笔记吗？此操作不可撤销。</div>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="deletingId = null">取消</button>
            <button class="modal-btn confirm" @click="confirmDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.note-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
}

.note-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.create-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: #667eea;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.create-btn:hover {
  background: #5a6fd6;
}

.note-items {
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

.note-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 4px;
}

.note-item:hover {
  background: #f0f0f0;
}

.note-item.active {
  background: rgba(102, 126, 234, 0.1);
}

.note-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.note-date {
  font-size: 11px;
  color: #aaa;
}

.note-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.note-item:hover .note-actions {
  opacity: 1;
}

.action-btn {
  border: none;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.15s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.note-edit {
  width: 100%;
}

.rename-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #667eea;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.modal-body {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 7px 18px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.modal-btn.cancel {
  background: #f0f0f0;
  color: #666;
}

.modal-btn.cancel:hover {
  background: #e0e0e0;
}

.modal-btn.confirm {
  background: #e74c3c;
  color: #fff;
}

.modal-btn.confirm:hover {
  background: #d43f31;
}
</style>
