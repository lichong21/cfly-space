<script lang="ts" setup>
import { ref } from 'vue';
import JsonFormatter from '@/components/json/JsonFormatter.vue';
import MarkdownEditor from '@/components/markdown/MarkdownEditor.vue';

const activeTab = ref(location.hash.slice(1) || 'json');

const navItems = [
  { key: 'json', label: 'JSON 格式化', icon: '{ }' },
  { key: 'markdown', label: 'Markdown', icon: '📝' },
];
</script>

<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">C</div>
        <span class="brand-text">CFly Space</span>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">工具箱</div>
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeTab === item.key }"
          @click="activeTab = item.key"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <span class="version">v1.0.0</span>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">
      <JsonFormatter v-if="activeTab === 'json'" />
      <MarkdownEditor v-else-if="activeTab === 'markdown'" />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  background: #f0f2f5;
}

/* ---- Sidebar ---- */
.sidebar {
  width: 220px;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  color: #fff;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.brand-text {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  overflow-y: auto;
}

.nav-section {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: rgba(255, 255, 255, 0.35);
  padding: 8px 10px 6px;
  font-weight: 600;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  margin-bottom: 2px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.nav-item.active {
  background: rgba(102, 126, 234, 0.25);
  color: #fff;
}

.nav-item.active .nav-icon {
  color: #667eea;
}

.nav-icon {
  width: 22px;
  text-align: center;
  font-size: 15px;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

.sidebar-footer {
  padding: 14px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.version {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
}

/* ---- Main ---- */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
</style>
