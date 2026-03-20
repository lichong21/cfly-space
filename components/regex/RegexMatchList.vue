<script lang="ts" setup>
import type { RegexMatch } from '@/types/regex';

defineProps<{
  matches: RegexMatch[];
}>();
</script>

<template>
  <div class="match-list">
    <div class="match-header">
      <span class="match-count">{{ matches.length }} 个匹配</span>
    </div>
    <div v-if="matches.length === 0" class="empty">无匹配结果</div>
    <div v-for="(m, i) in matches" :key="i" class="match-item">
      <div class="match-row">
        <span class="match-index">#{{ i + 1 }}</span>
        <span class="match-text">{{ m.text }}</span>
        <span class="match-pos">位置 {{ m.index }}</span>
      </div>
      <div v-if="m.groups.length > 0" class="groups">
        <div v-for="(g, gi) in m.groups" :key="gi" class="group-item">
          <span class="group-name">{{ g.name ? g.name : `Group ${gi + 1}` }}</span>
          <span class="group-value">{{ g.value ?? '(未捕获)' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.match-list {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
}

.match-header {
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
}

.match-count {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.empty {
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.match-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.match-item:last-child {
  border-bottom: none;
}

.match-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-index {
  font-size: 11px;
  color: #9ca3af;
  flex-shrink: 0;
}

.match-text {
  font-size: 13px;
  font-weight: 500;
  color: #1e40af;
  font-family: 'SF Mono', Monaco, monospace;
  word-break: break-all;
}

.match-pos {
  font-size: 11px;
  color: #9ca3af;
  margin-left: auto;
  flex-shrink: 0;
}

.groups {
  margin-top: 6px;
  padding-left: 24px;
}

.group-item {
  display: flex;
  gap: 8px;
  font-size: 12px;
  padding: 2px 0;
}

.group-name {
  color: #6b7280;
  flex-shrink: 0;
}

.group-value {
  color: #374151;
  font-family: 'SF Mono', Monaco, monospace;
  word-break: break-all;
}
</style>
