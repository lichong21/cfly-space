<script lang="ts" setup>
import type { DiffLine } from '@/composables/useDiff';

defineProps<{
  diffs: DiffLine[];
  viewMode: 'side' | 'inline';
  onlyDiff: boolean;
  contextLines: number;
}>();

function shouldShow(diffs: DiffLine[], idx: number, onlyDiff: boolean, contextLines: number): boolean {
  if (!onlyDiff) return true;
  const line = diffs[idx];
  if (line.type !== 'equal') return true;
  // Check if within context range of a diff line
  for (let i = Math.max(0, idx - contextLines); i <= Math.min(diffs.length - 1, idx + contextLines); i++) {
    if (diffs[i].type !== 'equal') return true;
  }
  return false;
}

function getSidePairs(diffs: DiffLine[]): Array<{ left: DiffLine | null; right: DiffLine | null }> {
  const pairs: Array<{ left: DiffLine | null; right: DiffLine | null }> = [];
  let i = 0;

  while (i < diffs.length) {
    const d = diffs[i];
    if (d.type === 'equal') {
      pairs.push({ left: d, right: d });
      i++;
    } else if (d.type === 'remove') {
      // Collect consecutive removes and adds
      const removes: DiffLine[] = [];
      while (i < diffs.length && diffs[i].type === 'remove') {
        removes.push(diffs[i]);
        i++;
      }
      const adds: DiffLine[] = [];
      while (i < diffs.length && diffs[i].type === 'add') {
        adds.push(diffs[i]);
        i++;
      }
      const maxLen = Math.max(removes.length, adds.length);
      for (let j = 0; j < maxLen; j++) {
        pairs.push({
          left: j < removes.length ? removes[j] : null,
          right: j < adds.length ? adds[j] : null,
        });
      }
    } else {
      pairs.push({ left: null, right: d });
      i++;
    }
  }
  return pairs;
}
</script>

<template>
  <!-- Inline View -->
  <div v-if="viewMode === 'inline'" class="diff-inline">
    <template v-for="(line, idx) in diffs" :key="idx">
      <div
        v-if="shouldShow(diffs, idx, onlyDiff, contextLines)"
        class="diff-line"
        :class="line.type"
      >
        <span class="line-num old">{{ line.oldLineNum ?? '' }}</span>
        <span class="line-num new">{{ line.newLineNum ?? '' }}</span>
        <span class="line-sign">{{ line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ' }}</span>
        <span class="line-text">{{ line.text }}</span>
      </div>
    </template>
  </div>

  <!-- Side by Side View -->
  <div v-else class="diff-side">
    <div class="side-header">
      <div class="side-col">原始文本</div>
      <div class="side-col">对比文本</div>
    </div>
    <div class="side-body">
      <div
        v-for="(pair, idx) in getSidePairs(diffs)"
        :key="idx"
        class="side-row"
      >
        <div class="side-col" :class="pair.left?.type ?? 'empty'">
          <span class="line-num">{{ pair.left?.oldLineNum ?? '' }}</span>
          <span class="line-text">{{ pair.left?.text ?? '' }}</span>
        </div>
        <div class="side-col" :class="pair.right?.type ?? 'empty'">
          <span class="line-num">{{ pair.right?.newLineNum ?? '' }}</span>
          <span class="line-text">{{ pair.right?.text ?? '' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Inline */
.diff-inline {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
}

.diff-line {
  display: flex;
  min-height: 22px;
  line-height: 22px;
}

.diff-line.add { background: #dcfce7; }
.diff-line.remove { background: #fee2e2; }

.line-num {
  width: 40px;
  text-align: right;
  padding: 0 6px;
  color: #9ca3af;
  flex-shrink: 0;
  user-select: none;
  border-right: 1px solid #f3f4f6;
}

.line-num.old { border-right: none; }

.line-sign {
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  color: #6b7280;
  user-select: none;
}

.diff-line.add .line-sign { color: #16a34a; }
.diff-line.remove .line-sign { color: #dc2626; }

.line-text {
  flex: 1;
  padding: 0 8px;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Side by Side */
.diff-side {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
}

.side-header {
  display: flex;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.side-header .side-col {
  flex: 1;
  padding: 6px 12px;
  font-weight: 600;
  color: #6b7280;
  font-size: 11px;
  font-family: -apple-system, sans-serif;
}

.side-header .side-col + .side-col {
  border-left: 1px solid #e5e7eb;
}

.side-body {
  max-height: 500px;
  overflow-y: auto;
}

.side-row {
  display: flex;
  min-height: 22px;
}

.side-row .side-col {
  flex: 1;
  display: flex;
  line-height: 22px;
  min-height: 22px;
}

.side-row .side-col + .side-col {
  border-left: 1px solid #e5e7eb;
}

.side-row .side-col.add { background: #dcfce7; }
.side-row .side-col.remove { background: #fee2e2; }
.side-row .side-col.empty { background: #f9fafb; }

.side-row .line-num {
  width: 36px;
  border-right: 1px solid #f3f4f6;
}

.side-row .line-text {
  padding: 0 8px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
