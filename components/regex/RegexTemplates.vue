<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRegexStore } from '@/stores/regex';
import type { RegexTemplate } from '@/types/regex';
import { BUILTIN_TEMPLATES, CATEGORY_LABELS } from '@/types/regex';

const emit = defineEmits<{
  select: [pattern: string, flags: string];
}>();

const store = useRegexStore();
const saveName = ref('');
const showSave = ref(false);

const props = defineProps<{
  currentPattern: string;
  currentFlags: string;
}>();

const allTemplates = computed(() => {
  const builtins = BUILTIN_TEMPLATES.map((t, i) => ({
    ...t,
    id: `builtin-${i}`,
  }));
  return [...builtins, ...store.customTemplates];
});

const grouped = computed(() => {
  const map: Record<string, (RegexTemplate & { id: string })[]> = {};
  for (const t of allTemplates.value) {
    const cat = t.category;
    if (!map[cat]) map[cat] = [];
    map[cat].push(t as RegexTemplate & { id: string });
  }
  return map;
});

function saveCustom() {
  if (!saveName.value.trim() || !props.currentPattern) return;
  store.addTemplate(saveName.value.trim(), props.currentPattern, props.currentFlags);
  saveName.value = '';
  showSave.value = false;
}
</script>

<template>
  <div class="templates">
    <div class="tpl-header">
      <span class="tpl-title">正则模板</span>
      <button class="btn-sm" @click="showSave = !showSave">
        {{ showSave ? '取消' : '收藏当前' }}
      </button>
    </div>

    <div v-if="showSave" class="save-row">
      <input
        v-model="saveName"
        class="save-input"
        placeholder="输入模板名称"
        @keydown.enter="saveCustom"
      />
      <button class="btn-save" @click="saveCustom" :disabled="!saveName.trim()">保存</button>
    </div>

    <div v-for="(items, category) in grouped" :key="category" class="tpl-group">
      <div class="group-label">{{ CATEGORY_LABELS[category] || category }}</div>
      <div class="tpl-list">
        <button
          v-for="t in items"
          :key="t.id"
          class="tpl-item"
          @click="emit('select', t.pattern, t.flags)"
        >
          <span class="tpl-name">{{ t.name }}</span>
          <button
            v-if="!t.isBuiltin"
            class="btn-del"
            @click.stop="store.removeTemplate(t.id)"
            title="删除"
          >
            &times;
          </button>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.templates {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
}

.tpl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
}

.tpl-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.save-row {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.save-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
}

.save-input:focus {
  border-color: #1a73e8;
}

.btn-save {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  background: #1a73e8;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tpl-group {
  padding: 8px 12px;
}

.group-label {
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.tpl-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tpl-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}

.tpl-item:hover {
  border-color: #1a73e8;
  color: #1a73e8;
  background: #f0f4ff;
}

.tpl-name {
  pointer-events: none;
}

.btn-del {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.btn-del:hover {
  color: #ef4444;
}

.btn-sm {
  padding: 3px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  font-size: 11px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-sm:hover {
  background: #f0f4ff;
  border-color: #1a73e8;
  color: #1a73e8;
}
</style>
