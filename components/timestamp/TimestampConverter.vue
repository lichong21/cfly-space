<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useCopy } from '@/composables/useCopy';
import { useTimestampStore } from '@/stores/timestamp';
import type { TimestampResult, ConvertMode, DurationParts, InputType } from '@/types/timestamp';

const store = useTimestampStore();
const { copied, copy } = useCopy();
const copiedKey = ref('');

// ---- Real-time timestamp ----
const nowSeconds = ref(0);
const nowMilliseconds = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

function updateNow() {
  const now = Date.now();
  nowSeconds.value = Math.floor(now / 1000);
  nowMilliseconds.value = now;
}

onMounted(() => {
  updateNow();
  timer = setInterval(updateNow, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// ---- Copy helper ----
async function copyWithKey(text: string, key: string) {
  copiedKey.value = key;
  await copy(text);
}

function isCopied(key: string) {
  return copied.value && copiedKey.value === key;
}

// ---- Convert Mode ----
const convertMode = ref<ConvertMode>('single');

// ---- Single Input ----
const singleInput = ref('');
const singleWarning = ref('');

const singleResult = computed<TimestampResult | null>(() => {
  const input = singleInput.value.trim();
  if (!input) {
    singleWarning.value = '';
    return null;
  }
  return convertInput(input);
});

function detectInputType(input: string): InputType {
  // Pure number (possibly negative)
  if (/^-?\d+$/.test(input)) return 'timestamp';
  // Try parsing as date string
  const d = new Date(input);
  if (!isNaN(d.getTime())) return 'datetime';
  return 'unknown';
}

function convertInput(input: string): TimestampResult | null {
  const type = detectInputType(input);
  singleWarning.value = '';

  if (type === 'timestamp') {
    const num = Number(input);
    const digits = input.replace(/^-/, '').length;

    // Warn about unusual digit counts
    if (digits === 9 || digits === 11 || digits === 12) {
      singleWarning.value = `检测到 ${digits} 位时间戳，请确认是否正确（常见为 10 位秒级或 13 位毫秒级）`;
    }

    let ms: number;
    if (digits >= 13) {
      // Millisecond timestamp
      ms = num;
    } else {
      // Second timestamp
      ms = num * 1000;
    }

    return buildResult(ms);
  }

  if (type === 'datetime') {
    const d = new Date(input);
    return buildResult(d.getTime());
  }

  singleWarning.value = '无法识别的输入格式';
  return null;
}

function buildResult(ms: number): TimestampResult {
  const d = new Date(ms);
  const seconds = Math.floor(ms / 1000);

  return {
    seconds,
    milliseconds: ms,
    iso8601: d.toISOString(),
    local: d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    utc: d.toUTCString(),
    relative: getRelativeTime(ms),
  };
}

function getRelativeTime(ms: number): string {
  const diff = ms - Date.now();
  const absDiff = Math.abs(diff);
  const suffix = diff < 0 ? '前' : '后';

  if (absDiff < 60000) return '刚刚';
  if (absDiff < 3600000) return `${Math.floor(absDiff / 60000)} 分钟${suffix}`;
  if (absDiff < 86400000) return `${Math.floor(absDiff / 3600000)} 小时${suffix}`;
  if (absDiff < 2592000000) return `${Math.floor(absDiff / 86400000)} 天${suffix}`;
  if (absDiff < 31536000000) return `${Math.floor(absDiff / 2592000000)} 个月${suffix}`;
  return `${Math.floor(absDiff / 31536000000)} 年${suffix}`;
}

// Save to history on result change
watch(singleResult, (result) => {
  if (result && singleInput.value.trim()) {
    store.addRecord({
      input: singleInput.value.trim(),
      inputType: detectInputType(singleInput.value.trim()),
      resultSeconds: result.seconds,
      resultLocal: result.local,
    });
  }
});

// ---- Batch Mode ----
const batchInput = ref('');

const batchResults = computed<Array<{ input: string; result: TimestampResult | null }>>(() => {
  const lines = batchInput.value.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const input = line.trim();
    const type = detectInputType(input);
    if (type === 'unknown') return { input, result: null };

    if (type === 'timestamp') {
      const num = Number(input);
      const digits = input.replace(/^-/, '').length;
      const ms = digits >= 13 ? num : num * 1000;
      return { input, result: buildResult(ms) };
    }

    const d = new Date(input);
    return { input, result: buildResult(d.getTime()) };
  });
});

// ---- Date Diff ----
const diffExpanded = ref(false);
const diffInput1 = ref('');
const diffInput2 = ref('');

function parseToMs(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^-?\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    const digits = trimmed.replace(/^-/, '').length;
    return digits >= 13 ? num : num * 1000;
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.getTime();
}

const diffResult = computed(() => {
  const ms1 = parseToMs(diffInput1.value);
  const ms2 = parseToMs(diffInput2.value);
  if (ms1 === null || ms2 === null) return null;

  const diffMs = Math.abs(ms2 - ms1);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} 天`);
  if (hours > 0) parts.push(`${hours} 小时`);
  if (minutes > 0) parts.push(`${minutes} 分钟`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} 秒`);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    readable: parts.join(' '),
  };
});

// ---- Duration Converter ----
const durationExpanded = ref(false);

// Seconds → Readable
const durationSecondsInput = ref('');
const durationReadable = computed(() => {
  const num = Number(durationSecondsInput.value);
  if (!durationSecondsInput.value.trim() || isNaN(num) || num < 0) return '';
  const totalSec = Math.floor(num);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} 天`);
  if (hours > 0) parts.push(`${hours} 小时`);
  if (minutes > 0) parts.push(`${minutes} 分钟`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} 秒`);
  return parts.join(' ');
});

// Readable → Seconds
const durationParts = ref<DurationParts>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
const durationTotalSeconds = computed(() => {
  const p = durationParts.value;
  return p.days * 86400 + p.hours * 3600 + p.minutes * 60 + p.seconds;
});

// ---- History ----
const historyExpanded = ref(false);

function fillFromHistory(record: { input: string }) {
  convertMode.value = 'single';
  singleInput.value = record.input;
}
</script>

<template>
  <div class="timestamp-converter">
    <div class="panel-header">
      <h2 class="panel-title">时间戳转换</h2>
      <p class="panel-desc">Unix 时间戳与日期时间双向转换，支持智能识别</p>
    </div>

    <!-- 3a: Real-time Timestamp -->
    <div class="status-bar">
      <div class="status-item">
        <span class="status-label">当前时间戳（秒）</span>
        <span class="status-value clickable" @click="copyWithKey(String(nowSeconds), 'now-s')">
          {{ nowSeconds }}
          <span class="copy-hint">{{ isCopied('now-s') ? '已复制' : '点击复制' }}</span>
        </span>
      </div>
      <div class="status-item">
        <span class="status-label">当前时间戳（毫秒）</span>
        <span class="status-value clickable" @click="copyWithKey(String(nowMilliseconds), 'now-ms')">
          {{ nowMilliseconds }}
          <span class="copy-hint">{{ isCopied('now-ms') ? '已复制' : '点击复制' }}</span>
        </span>
      </div>
    </div>

    <!-- 3b: Main Conversion -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">转换</h3>
        <div class="mode-switch">
          <button
            class="mode-btn"
            :class="{ active: convertMode === 'single' }"
            @click="convertMode = 'single'"
          >
            单个
          </button>
          <button
            class="mode-btn"
            :class="{ active: convertMode === 'batch' }"
            @click="convertMode = 'batch'"
          >
            批量
          </button>
        </div>
      </div>

      <!-- Single Mode -->
      <template v-if="convertMode === 'single'">
        <input
          v-model="singleInput"
          class="input-main"
          placeholder="输入时间戳或日期字符串，如 1700000000 或 2024-01-01 12:00:00"
        />
        <div v-if="singleWarning" class="warning-tip">{{ singleWarning }}</div>

        <div v-if="singleResult" class="result-grid">
          <div class="result-item" v-for="item in [
            { label: '秒级时间戳', value: String(singleResult.seconds), key: 'r-s' },
            { label: '毫秒级时间戳', value: String(singleResult.milliseconds), key: 'r-ms' },
            { label: 'ISO 8601', value: singleResult.iso8601, key: 'r-iso' },
            { label: '本地时间', value: singleResult.local, key: 'r-local' },
            { label: 'UTC 时间', value: singleResult.utc, key: 'r-utc' },
            { label: '相对时间', value: singleResult.relative, key: 'r-rel' },
          ]" :key="item.key">
            <span class="result-label">{{ item.label }}</span>
            <div class="result-value-row">
              <span class="result-value">{{ item.value }}</span>
              <button class="btn-copy" @click="copyWithKey(item.value, item.key)">
                {{ isCopied(item.key) ? '已复制' : '复制' }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Batch Mode -->
      <template v-else>
        <textarea
          v-model="batchInput"
          class="input-batch"
          placeholder="每行输入一个时间戳或日期字符串"
          rows="5"
        />
        <div v-if="batchResults.length" class="batch-results">
          <div
            v-for="(item, idx) in batchResults"
            :key="idx"
            class="batch-result-item"
          >
            <div class="batch-input-label">{{ item.input }}</div>
            <div v-if="item.result" class="batch-result-detail">
              <span>{{ item.result.local }}</span>
              <span class="batch-sep">|</span>
              <span>{{ item.result.seconds }}</span>
              <button class="btn-copy" @click="copyWithKey(item.result.local, `batch-${idx}`)">
                {{ isCopied(`batch-${idx}`) ? '已复制' : '复制' }}
              </button>
            </div>
            <div v-else class="batch-error">无法识别</div>
          </div>
        </div>
      </template>
    </div>

    <!-- 3c: Date Diff -->
    <div class="section collapsible">
      <button class="collapse-header" @click="diffExpanded = !diffExpanded">
        <h3 class="section-title">日期差值计算</h3>
        <span class="collapse-icon" :class="{ expanded: diffExpanded }">▶</span>
      </button>
      <div v-if="diffExpanded" class="collapse-body">
        <div class="diff-inputs">
          <input
            v-model="diffInput1"
            class="input-main"
            placeholder="起始：时间戳或日期字符串"
          />
          <span class="diff-arrow">↔</span>
          <input
            v-model="diffInput2"
            class="input-main"
            placeholder="结束：时间戳或日期字符串"
          />
        </div>
        <div v-if="diffResult" class="diff-result">
          <div class="result-grid compact">
            <div class="result-item" v-for="item in [
              { label: '天', value: diffResult.days },
              { label: '小时', value: diffResult.hours },
              { label: '分钟', value: diffResult.minutes },
              { label: '秒', value: diffResult.seconds },
            ]" :key="item.label">
              <span class="result-value highlight">{{ item.value }}</span>
              <span class="result-label">{{ item.label }}</span>
            </div>
          </div>
          <div class="diff-readable">
            总计：{{ diffResult.readable }}（{{ diffResult.totalSeconds }} 秒）
          </div>
        </div>
      </div>
    </div>

    <!-- 3d: Duration Converter -->
    <div class="section collapsible">
      <button class="collapse-header" @click="durationExpanded = !durationExpanded">
        <h3 class="section-title">秒数 ↔ 可读时长</h3>
        <span class="collapse-icon" :class="{ expanded: durationExpanded }">▶</span>
      </button>
      <div v-if="durationExpanded" class="collapse-body">
        <!-- Seconds → Readable -->
        <div class="duration-section">
          <div class="config-item">
            <div class="config-label">
              <span class="config-name">秒数 → 可读时长</span>
            </div>
          </div>
          <input
            v-model="durationSecondsInput"
            class="input-main"
            type="number"
            min="0"
            placeholder="输入秒数，如 3661"
          />
          <div v-if="durationReadable" class="duration-result">
            {{ durationReadable }}
            <button class="btn-copy" @click="copyWithKey(durationReadable, 'dur-read')">
              {{ isCopied('dur-read') ? '已复制' : '复制' }}
            </button>
          </div>
        </div>

        <!-- Readable → Seconds -->
        <div class="duration-section">
          <div class="config-item">
            <div class="config-label">
              <span class="config-name">天/时/分/秒 → 总秒数</span>
            </div>
          </div>
          <div class="duration-inputs">
            <label class="duration-field">
              <input v-model.number="durationParts.days" type="number" min="0" />
              <span>天</span>
            </label>
            <label class="duration-field">
              <input v-model.number="durationParts.hours" type="number" min="0" />
              <span>时</span>
            </label>
            <label class="duration-field">
              <input v-model.number="durationParts.minutes" type="number" min="0" />
              <span>分</span>
            </label>
            <label class="duration-field">
              <input v-model.number="durationParts.seconds" type="number" min="0" />
              <span>秒</span>
            </label>
          </div>
          <div v-if="durationTotalSeconds > 0" class="duration-result">
            {{ durationTotalSeconds }} 秒
            <button class="btn-copy" @click="copyWithKey(String(durationTotalSeconds), 'dur-sec')">
              {{ isCopied('dur-sec') ? '已复制' : '复制' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3e: History -->
    <div class="section collapsible">
      <button class="collapse-header" @click="historyExpanded = !historyExpanded">
        <h3 class="section-title">转换历史</h3>
        <span class="collapse-icon" :class="{ expanded: historyExpanded }">▶</span>
      </button>
      <div v-if="historyExpanded" class="collapse-body">
        <div v-if="store.history.length === 0" class="empty-hint">暂无历史记录</div>
        <template v-else>
          <div class="history-actions">
            <button class="btn btn-outline" @click="store.clearHistory()">清空历史</button>
          </div>
          <div class="history-list">
            <button
              v-for="record in store.history"
              :key="record.id"
              class="history-item"
              @click="fillFromHistory(record)"
            >
              <span class="history-input">{{ record.input }}</span>
              <span class="history-result">{{ record.resultLocal }}</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timestamp-converter {
  padding: 28px 32px;
  max-width: 720px;
  overflow-y: auto;
  height: 100%;
}

/* ---- Header ---- */
.panel-header {
  margin-bottom: 24px;
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

/* ---- Status Bar ---- */
.status-bar {
  display: flex;
  gap: 16px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #e0f2fe, #dbeafe);
  border-radius: 10px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.status-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-value {
  font-size: 15px;
  font-weight: 600;
  color: #1e40af;
  font-variant-numeric: tabular-nums;
}

.status-value.clickable {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-value.clickable:hover {
  color: #1a73e8;
}

.copy-hint {
  font-size: 10px;
  font-weight: 400;
  color: #9ca3af;
}

/* ---- Section ---- */
.section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

/* ---- Mode Switch ---- */
.mode-switch {
  display: flex;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
}

.mode-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #6b7280;
  transition: all 0.15s;
}

.mode-btn.active {
  background: #fff;
  color: #1a73e8;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

/* ---- Input ---- */
.input-main {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.input-main:focus {
  border-color: #1a73e8;
}

.input-batch {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  outline: none;
  resize: vertical;
  font-family: 'SF Mono', Monaco, monospace;
  box-sizing: border-box;
}

.input-batch:focus {
  border-color: #1a73e8;
}

/* ---- Warning ---- */
.warning-tip {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  font-size: 12px;
  color: #92400e;
}

/* ---- Result Grid ---- */
.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.result-grid.compact {
  grid-template-columns: repeat(4, 1fr);
  text-align: center;
}

.result-item {
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.result-label {
  font-size: 11px;
  color: #9ca3af;
  display: block;
  margin-bottom: 4px;
}

.result-value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.result-value {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  word-break: break-all;
}

.result-value.highlight {
  font-size: 20px;
  color: #1e40af;
}

.btn-copy {
  padding: 2px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  font-size: 11px;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s;
}

.btn-copy:hover {
  background: #f0f4ff;
  border-color: #1a73e8;
  color: #1a73e8;
}

/* ---- Batch Results ---- */
.batch-results {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.batch-result-item {
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.batch-input-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
  font-family: 'SF Mono', Monaco, monospace;
}

.batch-result-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.batch-sep {
  color: #d1d5db;
}

.batch-error {
  font-size: 12px;
  color: #ef4444;
}

/* ---- Collapsible ---- */
.collapsible {
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  overflow: hidden;
}

.collapse-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: #f9fafb;
  cursor: pointer;
  transition: background 0.15s;
}

.collapse-header:hover {
  background: #f3f4f6;
}

.collapse-icon {
  font-size: 10px;
  color: #9ca3af;
  transition: transform 0.2s;
}

.collapse-icon.expanded {
  transform: rotate(90deg);
}

.collapse-body {
  padding: 16px;
}

/* ---- Date Diff ---- */
.diff-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.diff-inputs .input-main {
  flex: 1;
}

.diff-arrow {
  font-size: 16px;
  color: #9ca3af;
  flex-shrink: 0;
}

.diff-result {
  margin-top: 14px;
}

.diff-readable {
  margin-top: 10px;
  font-size: 13px;
  color: #6b7280;
  text-align: center;
}

/* ---- Duration ---- */
.duration-section {
  margin-bottom: 16px;
}

.duration-section:last-child {
  margin-bottom: 0;
}

.duration-inputs {
  display: flex;
  gap: 10px;
}

.duration-field {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.duration-field input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  outline: none;
  text-align: center;
}

.duration-field input:focus {
  border-color: #1a73e8;
}

.duration-field span {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}

.duration-result {
  margin-top: 10px;
  padding: 10px 14px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ---- Config ---- */
.config-item {
  padding: 8px 0;
}

.config-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.config-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

/* ---- History ---- */
.history-actions {
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-end;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
  font-size: 13px;
}

.history-item:hover {
  background: #f0f4ff;
  border-color: #1a73e8;
}

.history-input {
  font-family: 'SF Mono', Monaco, monospace;
  color: #374151;
}

.history-result {
  color: #6b7280;
  font-size: 12px;
}

.empty-hint {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 20px 0;
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

.btn-outline {
  background: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}
</style>
