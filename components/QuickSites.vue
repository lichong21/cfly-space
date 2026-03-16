<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useQuickSiteStore } from '@/stores/quickSite';
import { DEFAULT_GROUP_ID } from '@/types/quickSite';
import type { QuickSite } from '@/types/quickSite';

const store = useQuickSiteStore();

// ---- Computed: grouped sites ----
const sortedGroups = computed(() =>
  [...store.state.groups].sort((a, b) => a.order - b.order),
);

function sitesInGroup(groupId: string) {
  return store.state.sites
    .filter(s => s.groupId === groupId)
    .sort((a, b) => a.order - b.order);
}

// ---- Modal state ----
const showModal = ref(false);
const editingSite = ref<QuickSite | null>(null);

const formName = ref('');
const formUrl = ref('');
const formGroupId = ref(DEFAULT_GROUP_ID);
const formNewGroup = ref('');
const formError = ref('');

function openAdd() {
  editingSite.value = null;
  formName.value = '';
  formUrl.value = '';
  formGroupId.value = DEFAULT_GROUP_ID;
  formNewGroup.value = '';
  formError.value = '';
  showModal.value = true;
}

function openEdit(site: QuickSite) {
  editingSite.value = site;
  formName.value = site.name;
  formUrl.value = site.url;
  formGroupId.value = site.groupId;
  formNewGroup.value = '';
  formError.value = '';
  showModal.value = true;
}

function submitForm() {
  const name = formName.value.trim();
  const url = formUrl.value.trim();

  if (!name) { formError.value = '请输入网站名称'; return; }
  if (name.length > 20) { formError.value = '名称不能超过 20 个字符'; return; }
  if (!url) { formError.value = '请输入网站地址'; return; }
  if (!/^https?:\/\/.+/.test(url)) { formError.value = '请输入有效的 URL（以 http:// 或 https:// 开头）'; return; }

  let groupId = formGroupId.value;
  if (formNewGroup.value.trim()) {
    const gName = formNewGroup.value.trim();
    if (gName.length > 10) { formError.value = '分组名称不能超过 10 个字符'; return; }
    groupId = store.addGroup(gName);
  }

  if (editingSite.value) {
    store.updateSite(editingSite.value.id, { name, url, groupId });
  } else {
    store.addSite(name, url, groupId);
  }
  showModal.value = false;
}

// ---- Delete confirm ----
const deleteTarget = ref<QuickSite | null>(null);

function confirmDelete(site: QuickSite) {
  deleteTarget.value = site;
}

function doDelete() {
  if (deleteTarget.value) {
    store.removeSite(deleteTarget.value.id);
    deleteTarget.value = null;
  }
}

// ---- Group actions ----
const renamingGroupId = ref<string | null>(null);
const renameGroupName = ref('');

function startRenameGroup(groupId: string, currentName: string) {
  renamingGroupId.value = groupId;
  renameGroupName.value = currentName;
}

function finishRenameGroup() {
  if (renamingGroupId.value && renameGroupName.value.trim()) {
    const name = renameGroupName.value.trim().slice(0, 10);
    store.updateGroup(renamingGroupId.value, { name });
  }
  renamingGroupId.value = null;
}

function deleteGroup(groupId: string) {
  store.removeGroup(groupId);
}

// ---- Favicon ----
const faviconErrors = ref<Set<string>>(new Set());

function faviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

function onFaviconError(siteId: string) {
  faviconErrors.value.add(siteId);
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function initialBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 65%)`;
}

function openSite(url: string) {
  window.open(url, '_blank');
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
</script>

<template>
  <div class="quick-sites">
    <div class="panel-header">
      <div class="panel-title-row">
        <h2 class="panel-title">常用网站</h2>
        <button class="btn btn-primary" @click="openAdd">+ 添加网站</button>
      </div>
      <p class="panel-desc">集中管理和快速访问你的常用网站</p>
    </div>

    <!-- Empty state -->
    <div v-if="store.state.sites.length === 0" class="empty-state">
      <div class="empty-icon">🌐</div>
      <p class="empty-text">还没有添加常用网站，点击上方按钮添加吧</p>
    </div>

    <!-- Groups & Cards -->
    <div v-else class="groups">
      <div
        v-for="group in sortedGroups"
        :key="group.id"
        class="group"
      >
        <!-- Only show group if it has sites or is not the default ungrouped (when there are custom groups) -->
        <template v-if="sitesInGroup(group.id).length > 0">
          <div class="group-header">
            <button class="group-toggle" @click="store.toggleGroupCollapse(group.id)">
              <span class="toggle-arrow" :class="{ collapsed: group.collapsed }">▶</span>
            </button>

            <template v-if="renamingGroupId === group.id">
              <input
                v-model="renameGroupName"
                class="rename-input"
                maxlength="10"
                @keyup.enter="finishRenameGroup"
                @blur="finishRenameGroup"
                @vue:mounted="($event: any) => $event.el.focus()"
              />
            </template>
            <span v-else class="group-name">{{ group.name }}</span>

            <span class="group-count">{{ sitesInGroup(group.id).length }}</span>

            <div v-if="group.id !== DEFAULT_GROUP_ID" class="group-actions">
              <button class="action-btn" title="重命名" @click="startRenameGroup(group.id, group.name)">✏️</button>
              <button class="action-btn" title="删除分组" @click="deleteGroup(group.id)">🗑️</button>
            </div>
          </div>

          <div v-show="!group.collapsed" class="site-grid">
            <div
              v-for="site in sitesInGroup(group.id)"
              :key="site.id"
              class="site-card"
              :title="site.url"
              @click="openSite(site.url)"
            >
              <div class="card-actions">
                <button class="card-action-btn" title="编辑" @click.stop="openEdit(site)">✏️</button>
                <button class="card-action-btn" title="删除" @click.stop="confirmDelete(site)">🗑️</button>
              </div>
              <div class="site-favicon">
                <img
                  v-if="!faviconErrors.has(site.id)"
                  :src="faviconUrl(site.url)"
                  width="24"
                  height="24"
                  @error="onFaviconError(site.id)"
                />
                <span
                  v-else
                  class="favicon-initial"
                  :style="{ background: initialBg(site.name) }"
                >{{ getInitial(site.name) }}</span>
              </div>
              <div class="site-name">{{ site.name }}</div>
              <div class="site-domain">{{ getDomain(site.url) }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <h3 class="modal-title">{{ editingSite ? '编辑网站' : '添加网站' }}</h3>
          <div class="form-group">
            <label class="form-label">网站名称</label>
            <input
              v-model="formName"
              class="form-input"
              placeholder="例如：GitHub"
              maxlength="20"
            />
          </div>
          <div class="form-group">
            <label class="form-label">网站地址</label>
            <input
              v-model="formUrl"
              class="form-input"
              placeholder="https://example.com"
            />
          </div>
          <div class="form-group">
            <label class="form-label">所属分组</label>
            <select v-model="formGroupId" class="form-input">
              <option
                v-for="g in store.state.groups"
                :key="g.id"
                :value="g.id"
              >{{ g.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">新建分组（可选）</label>
            <input
              v-model="formNewGroup"
              class="form-input"
              placeholder="输入新分组名称"
              maxlength="10"
            />
          </div>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showModal = false">取消</button>
            <button class="btn btn-primary" @click="submitForm">
              {{ editingSite ? '保存' : '添加' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal modal-sm">
          <h3 class="modal-title">确认删除</h3>
          <p class="modal-body">确定要删除「{{ deleteTarget.name }}」吗？此操作不可恢复。</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="deleteTarget = null">取消</button>
            <button class="btn btn-danger" @click="doDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.quick-sites {
  padding: 28px 32px;
  max-width: 720px;
}

/* ---- Header ---- */
.panel-header {
  margin-bottom: 24px;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.panel-desc {
  font-size: 13px;
  color: #9ca3af;
  margin: 6px 0 0;
}

/* ---- Buttons ---- */
.btn {
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background: #1a73e8;
  color: #fff;
}

.btn-primary:hover {
  background: #1557b0;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-danger:hover {
  background: #dc2626;
}

/* ---- Empty State ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  text-align: center;
}

/* ---- Groups ---- */
.group {
  margin-bottom: 20px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.group-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  font-size: 10px;
  color: #9ca3af;
  transition: transform 0.15s;
}

.toggle-arrow {
  display: inline-block;
  transition: transform 0.15s;
  transform: rotate(90deg);
}

.toggle-arrow.collapsed {
  transform: rotate(0deg);
}

.group-name {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-count {
  font-size: 11px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 8px;
}

.group-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.group-header:hover .group-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
}

.action-btn:hover {
  background: #f3f4f6;
}

.rename-input {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  border: 1px solid #1a73e8;
  border-radius: 4px;
  padding: 2px 6px;
  outline: none;
  width: 120px;
}

/* ---- Site Grid ---- */
.site-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.site-card {
  position: relative;
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.site-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
}

.card-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.site-card:hover .card-actions {
  opacity: 1;
}

.card-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
}

.card-action-btn:hover {
  background: #f3f4f6;
}

.site-favicon img {
  display: block;
  border-radius: 4px;
}

.favicon-initial {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.site-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.site-domain {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* ---- Modal ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.modal-sm {
  width: 340px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 20px;
}

.modal-body {
  font-size: 14px;
  color: #4b5563;
  margin: 0 0 20px;
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #1a73e8;
}

.form-error {
  font-size: 12px;
  color: #ef4444;
  margin: 0 0 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
