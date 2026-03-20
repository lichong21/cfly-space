<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { Snippet } from '@/types/snippet';
import { LANGUAGE_OPTIONS, DEFAULT_FOLDER_ID } from '@/types/snippet';
import { useSnippetStore } from '@/stores/snippet';

const props = defineProps<{
  snippet?: Snippet | null;
}>();

const emit = defineEmits<{
  saved: [];
  cancel: [];
}>();

const store = useSnippetStore();

const title = ref('');
const code = ref('');
const language = ref('javascript');
const description = ref('');
const tagInput = ref('');
const tags = ref<string[]>([]);
const folderId = ref(DEFAULT_FOLDER_ID);

watch(() => props.snippet, (s) => {
  if (s) {
    title.value = s.title;
    code.value = s.code;
    language.value = s.language;
    description.value = s.description;
    tags.value = [...s.tags];
    folderId.value = s.folderId;
  } else {
    title.value = '';
    code.value = '';
    language.value = 'javascript';
    description.value = '';
    tags.value = [];
    folderId.value = DEFAULT_FOLDER_ID;
  }
}, { immediate: true });

function addTag() {
  const t = tagInput.value.trim();
  if (t && !tags.value.includes(t)) {
    tags.value.push(t);
  }
  tagInput.value = '';
}

function removeTag(tag: string) {
  tags.value = tags.value.filter(t => t !== tag);
}

function save() {
  if (!title.value.trim() || !code.value.trim()) return;

  const data = {
    title: title.value.trim(),
    code: code.value,
    language: language.value,
    description: description.value.trim(),
    tags: tags.value,
    folderId: folderId.value,
  };

  if (props.snippet) {
    store.updateSnippet(props.snippet.id, data);
  } else {
    store.createSnippet(data);
  }
  emit('saved');
}
</script>

<template>
  <div class="editor">
    <div class="editor-header">
      <h3 class="editor-title">{{ snippet ? '编辑片段' : '新建片段' }}</h3>
      <button class="btn-close" @click="emit('cancel')">&times;</button>
    </div>

    <div class="field">
      <label class="field-label">标题</label>
      <input v-model="title" class="field-input" placeholder="片段标题" />
    </div>

    <div class="field-row">
      <div class="field">
        <label class="field-label">语言</label>
        <select v-model="language" class="field-input">
          <option v-for="lang in LANGUAGE_OPTIONS" :key="lang" :value="lang">{{ lang }}</option>
        </select>
      </div>
      <div class="field">
        <label class="field-label">文件夹</label>
        <select v-model="folderId" class="field-input">
          <option :value="DEFAULT_FOLDER_ID">未分组</option>
          <option v-for="f in store.folders" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label class="field-label">代码</label>
      <textarea v-model="code" class="code-textarea" rows="10" placeholder="粘贴代码..." />
    </div>

    <div class="field">
      <label class="field-label">描述（可选）</label>
      <input v-model="description" class="field-input" placeholder="简短描述用途" />
    </div>

    <div class="field">
      <label class="field-label">标签</label>
      <div class="tags-area">
        <span v-for="tag in tags" :key="tag" class="tag">
          {{ tag }}
          <button class="tag-del" @click="removeTag(tag)">&times;</button>
        </span>
        <input
          v-model="tagInput"
          class="tag-input"
          placeholder="输入标签后回车"
          @keydown.enter.prevent="addTag"
        />
      </div>
    </div>

    <div class="editor-footer">
      <button class="btn-secondary" @click="emit('cancel')">取消</button>
      <button class="btn-primary" @click="save" :disabled="!title.trim() || !code.trim()">保存</button>
    </div>
  </div>
</template>

<style scoped>
.editor { padding: 16px; }
.editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.editor-title { font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 0; }
.btn-close { background: none; border: none; font-size: 20px; color: #9ca3af; cursor: pointer; }
.btn-close:hover { color: #374151; }

.field { margin-bottom: 12px; }
.field-row { display: flex; gap: 12px; }
.field-row .field { flex: 1; }
.field-label { display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px; }
.field-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #374151; outline: none; box-sizing: border-box; }
.field-input:focus { border-color: #1a73e8; }

.code-textarea { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; font-family: 'SF Mono', Monaco, monospace; color: #374151; outline: none; resize: vertical; box-sizing: border-box; }
.code-textarea:focus { border-color: #1a73e8; }

.tags-area { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; min-height: 36px; align-items: center; }
.tag { display: inline-flex; align-items: center; gap: 2px; padding: 2px 8px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 12px; }
.tag-del { background: none; border: none; color: #0369a1; cursor: pointer; font-size: 14px; line-height: 1; padding: 0 2px; }
.tag-del:hover { color: #dc2626; }
.tag-input { border: none; outline: none; font-size: 12px; min-width: 80px; flex: 1; color: #374151; }

.editor-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.btn-primary { padding: 8px 20px; border: none; border-radius: 6px; background: #1a73e8; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-primary:hover { background: #1557b0; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary { padding: 8px 20px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 13px; color: #6b7280; cursor: pointer; }
.btn-secondary:hover { background: #f9fafb; }
</style>
