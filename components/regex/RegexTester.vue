<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useCopy } from '@/composables/useCopy';
import type { RegexMatch } from '@/types/regex';
import RegexMatchList from './RegexMatchList.vue';
import RegexTemplates from './RegexTemplates.vue';

const { copied, copy } = useCopy();

const pattern = ref('');
const flags = ref('g');
const testText = ref('');
const regexError = ref('');
const showReplace = ref(false);
const replaceStr = ref('');
const showTemplates = ref(false);

const FLAG_OPTIONS = ['g', 'i', 'm', 's', 'u'] as const;

function toggleFlag(f: string) {
  flags.value = flags.value.includes(f)
    ? flags.value.replace(f, '')
    : flags.value + f;
}

// Debounced regex execution
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const matches = ref<RegexMatch[]>([]);

function executeMatch() {
  matches.value = [];
  regexError.value = '';
  if (!pattern.value || !testText.value) return;

  try {
    const re = new RegExp(pattern.value, flags.value);
    const results: RegexMatch[] = [];
    let match: RegExpExecArray | null;
    let count = 0;

    if (flags.value.includes('g')) {
      while ((match = re.exec(testText.value)) !== null && count < 500) {
        results.push(buildMatch(match));
        count++;
        if (match.index === re.lastIndex) re.lastIndex++;
      }
    } else {
      match = re.exec(testText.value);
      if (match) results.push(buildMatch(match));
    }

    matches.value = results;
  } catch (e) {
    regexError.value = (e as Error).message;
  }
}

function buildMatch(match: RegExpExecArray): RegexMatch {
  const groups: RegexMatch['groups'] = [];
  for (let i = 1; i < match.length; i++) {
    const name = match.groups
      ? Object.entries(match.groups).find(([, v]) => v === match[i])?.[0] ?? null
      : null;
    groups.push({ name, value: match[i] });
  }
  return { index: match.index, text: match[0], groups };
}

watch([pattern, flags, testText], () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(executeMatch, 200);
});

// Highlighted text
const highlightedHtml = computed(() => {
  if (!pattern.value || !testText.value || regexError.value) {
    return escapeHtml(testText.value);
  }
  try {
    const re = new RegExp(pattern.value, flags.value.includes('g') ? flags.value : flags.value + 'g');
    let idx = 0;
    const parts: string[] = [];
    let match: RegExpExecArray | null;
    let count = 0;

    while ((match = re.exec(testText.value)) !== null && count < 500) {
      if (match.index > idx) {
        parts.push(escapeHtml(testText.value.slice(idx, match.index)));
      }
      const colorClass = count % 2 === 0 ? 'hl-a' : 'hl-b';
      parts.push(`<mark class="${colorClass}">${escapeHtml(match[0])}</mark>`);
      idx = match.index + match[0].length;
      count++;
      if (match.index === re.lastIndex) re.lastIndex++;
    }

    if (idx < testText.value.length) {
      parts.push(escapeHtml(testText.value.slice(idx)));
    }
    return parts.join('');
  } catch {
    return escapeHtml(testText.value);
  }
});

// Replace preview
const replacePreview = computed(() => {
  if (!pattern.value || !testText.value || !showReplace.value) return '';
  try {
    const re = new RegExp(pattern.value, flags.value);
    return testText.value.replace(re, replaceStr.value);
  } catch {
    return '';
  }
});

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applyTemplate(p: string, f: string) {
  pattern.value = p;
  flags.value = f;
}
</script>

<template>
  <div class="regex-tester">
    <div class="panel-header">
      <h2 class="panel-title">正则表达式测试器</h2>
      <p class="panel-desc">实时匹配高亮、捕获组展示、替换预览</p>
    </div>

    <!-- Pattern Input -->
    <div class="pattern-row">
      <span class="pattern-slash">/</span>
      <input
        v-model="pattern"
        class="pattern-input"
        placeholder="输入正则表达式"
      />
      <span class="pattern-slash">/</span>
      <div class="flag-btns">
        <button
          v-for="f in FLAG_OPTIONS"
          :key="f"
          class="flag-btn"
          :class="{ active: flags.includes(f) }"
          @click="toggleFlag(f)"
        >
          {{ f }}
        </button>
      </div>
    </div>
    <div v-if="regexError" class="regex-error">{{ regexError }}</div>

    <!-- Main Area -->
    <div class="main-area">
      <div class="left-col">
        <!-- Test Text with Highlight Overlay -->
        <div class="test-area">
          <div class="col-label">测试文本</div>
          <div class="highlight-wrapper">
            <div class="highlight-layer" v-html="highlightedHtml" />
            <textarea
              v-model="testText"
              class="test-textarea"
              placeholder="输入待匹配的测试文本..."
              rows="10"
            />
          </div>
        </div>

        <!-- Replace -->
        <div class="replace-section">
          <button class="toggle-btn" @click="showReplace = !showReplace">
            {{ showReplace ? '隐藏替换' : '显示替换' }}
          </button>
          <template v-if="showReplace">
            <input
              v-model="replaceStr"
              class="replace-input"
              placeholder="替换字符串（支持 $1, $2, $& 引用）"
            />
            <div class="replace-preview">
              <div class="col-label">
                替换结果
                <button class="btn-sm" @click="copy(replacePreview)" :disabled="!replacePreview">
                  {{ copied ? '已复制' : '复制' }}
                </button>
              </div>
              <pre class="preview-text">{{ replacePreview }}</pre>
            </div>
          </template>
        </div>
      </div>

      <div class="right-col">
        <RegexMatchList :matches="matches" />
      </div>
    </div>

    <!-- Templates -->
    <div class="template-section">
      <button class="toggle-btn" @click="showTemplates = !showTemplates">
        {{ showTemplates ? '隐藏模板' : '正则模板' }}
      </button>
      <RegexTemplates
        v-if="showTemplates"
        :current-pattern="pattern"
        :current-flags="flags"
        @select="applyTemplate"
      />
    </div>
  </div>
</template>

<style scoped>
.regex-tester {
  padding: 28px 32px;
  max-width: 960px;
  overflow-y: auto;
  height: 100%;
}

.panel-header {
  margin-bottom: 20px;
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

/* Pattern Row */
.pattern-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  margin-bottom: 6px;
}

.pattern-slash {
  font-size: 16px;
  color: #9ca3af;
  font-weight: 300;
  flex-shrink: 0;
}

.pattern-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, monospace;
  color: #374151;
  outline: none;
  min-width: 0;
}

.flag-btns {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.flag-btn {
  width: 26px;
  height: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  font-family: 'SF Mono', Monaco, monospace;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s;
}

.flag-btn.active {
  background: #1a73e8;
  border-color: #1a73e8;
  color: #fff;
}

.regex-error {
  padding: 6px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 12px;
  color: #dc2626;
  margin-bottom: 12px;
}

/* Main Area */
.main-area {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.left-col {
  flex: 1;
  min-width: 0;
}

.right-col {
  width: 280px;
  flex-shrink: 0;
}

.col-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Highlight */
.test-area {
  margin-bottom: 12px;
}

.highlight-wrapper {
  position: relative;
}

.highlight-layer {
  position: absolute;
  inset: 0;
  padding: 10px 14px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, monospace;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  color: transparent;
  pointer-events: none;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 8px;
}

.highlight-layer :deep(.hl-a) {
  background: rgba(59, 130, 246, 0.25);
  border-radius: 2px;
  color: transparent;
}

.highlight-layer :deep(.hl-b) {
  background: rgba(168, 85, 247, 0.25);
  border-radius: 2px;
  color: transparent;
}

.test-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, monospace;
  line-height: 1.5;
  color: #374151;
  outline: none;
  resize: vertical;
  min-height: 200px;
  background: transparent;
  position: relative;
  box-sizing: border-box;
}

.test-textarea:focus {
  border-color: #1a73e8;
}

/* Replace */
.replace-section {
  margin-bottom: 16px;
}

.replace-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, monospace;
  color: #374151;
  outline: none;
  margin-top: 8px;
  box-sizing: border-box;
}

.replace-input:focus {
  border-color: #1a73e8;
}

.replace-preview {
  margin-top: 10px;
}

.preview-text {
  padding: 10px 14px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, monospace;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

/* Template Section */
.template-section {
  margin-top: 16px;
}

/* Shared */
.toggle-btn {
  padding: 6px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 10px;
}

.toggle-btn:hover {
  border-color: #1a73e8;
  color: #1a73e8;
}

.btn-sm {
  padding: 2px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  font-size: 11px;
  color: #6b7280;
  cursor: pointer;
}

.btn-sm:hover:not(:disabled) {
  background: #f0f4ff;
  border-color: #1a73e8;
  color: #1a73e8;
}

.btn-sm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
