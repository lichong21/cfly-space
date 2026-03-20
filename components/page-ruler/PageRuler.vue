<script lang="ts" setup>
import { ref } from 'vue';

const isActive = ref(false);
const statusMessage = ref('');

async function toggleRuler() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      statusMessage.value = '无法获取当前标签页';
      return;
    }

    if (isActive.value) {
      // Remove ruler
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const overlay = document.getElementById('cfly-ruler-overlay');
          if (overlay) overlay.remove();
        },
      });
      isActive.value = false;
      statusMessage.value = '标尺已关闭';
    } else {
      // Inject ruler
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectRuler,
      });
      isActive.value = true;
      statusMessage.value = '标尺已激活，移动鼠标查看元素信息，按 ESC 退出';
    }
  } catch (e) {
    statusMessage.value = `注入失败：${(e as Error).message}`;
  }
}

function injectRuler() {
  if (document.getElementById('cfly-ruler-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'cfly-ruler-overlay';

  const shadow = overlay.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .ruler-highlight {
      position: fixed;
      pointer-events: none;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.08);
      z-index: 2147483646;
      transition: all 0.05s;
    }
    .ruler-info {
      position: fixed;
      z-index: 2147483647;
      background: #1a1a2e;
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-family: 'SF Mono', Monaco, monospace;
      max-width: 320px;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      line-height: 1.5;
    }
    .ruler-info .tag { color: #60a5fa; }
    .ruler-info .dim { color: #fbbf24; }
    .ruler-info .pos { color: #a78bfa; }
    .ruler-info .css { color: #34d399; }
    .ruler-toolbar {
      position: fixed;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: #1a1a2e;
      color: #fff;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-family: -apple-system, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ruler-toolbar button {
      background: rgba(255,255,255,0.15);
      border: none;
      color: #fff;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
    }
    .ruler-toolbar button:hover { background: rgba(255,255,255,0.25); }
  `;
  shadow.appendChild(style);

  const toolbar = document.createElement('div');
  toolbar.className = 'ruler-toolbar';
  toolbar.innerHTML = '<span>CFly 标尺</span><button id="ruler-close">ESC 关闭</button>';
  shadow.appendChild(toolbar);

  const highlight = document.createElement('div');
  highlight.className = 'ruler-highlight';
  shadow.appendChild(highlight);

  const info = document.createElement('div');
  info.className = 'ruler-info';
  info.style.display = 'none';
  shadow.appendChild(info);

  document.body.appendChild(overlay);

  function handleMouseMove(e: MouseEvent) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || overlay.contains(target)) return;

    const rect = target.getBoundingClientRect();
    highlight.style.left = rect.left + 'px';
    highlight.style.top = rect.top + 'px';
    highlight.style.width = rect.width + 'px';
    highlight.style.height = rect.height + 'px';

    const computed = window.getComputedStyle(target);
    const tagName = target.tagName.toLowerCase();
    const id = target.id ? `#${target.id}` : '';
    const cls = target.className && typeof target.className === 'string'
      ? '.' + target.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';

    info.innerHTML = [
      `<span class="tag">&lt;${tagName}${id}${cls}&gt;</span>`,
      `<span class="dim">${Math.round(rect.width)} × ${Math.round(rect.height)}</span>`,
      `<span class="pos">top: ${Math.round(rect.top)}  left: ${Math.round(rect.left)}</span>`,
      `<span class="css">font: ${computed.fontSize} / color: ${computed.color}</span>`,
      `<span class="css">bg: ${computed.backgroundColor}</span>`,
    ].join('<br>');

    info.style.display = 'block';

    let infoX = e.clientX + 16;
    let infoY = e.clientY + 16;
    if (infoX + 320 > window.innerWidth) infoX = e.clientX - 336;
    if (infoY + 120 > window.innerHeight) infoY = e.clientY - 130;
    info.style.left = infoX + 'px';
    info.style.top = infoY + 'px';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') cleanup();
  }

  function cleanup() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('keydown', handleKeyDown);
    overlay.remove();
  }

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('keydown', handleKeyDown);
  shadow.getElementById('ruler-close')?.addEventListener('click', cleanup);
}
</script>

<template>
  <div class="page-ruler">
    <div class="panel-header">
      <h2 class="panel-title">页面标尺 / 测量工具</h2>
      <p class="panel-desc">测量页面元素尺寸、间距和 CSS 属性</p>
    </div>

    <div class="intro-section">
      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-icon">📐</span>
          <div>
            <span class="feature-name">元素信息</span>
            <span class="feature-desc">悬停显示元素标签、尺寸、位置和 CSS 属性</span>
          </div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🎯</span>
          <div>
            <span class="feature-name">高亮边界</span>
            <span class="feature-desc">蓝色边框高亮当前元素区域</span>
          </div>
        </div>
        <div class="feature-item">
          <span class="feature-icon">⌨️</span>
          <div>
            <span class="feature-name">快捷退出</span>
            <span class="feature-desc">按 ESC 键退出测量模式</span>
          </div>
        </div>
      </div>

      <button
        class="btn-activate"
        :class="{ active: isActive }"
        @click="toggleRuler"
      >
        {{ isActive ? '关闭标尺' : '激活标尺' }}
      </button>

      <div v-if="statusMessage" class="status-msg">{{ statusMessage }}</div>

      <div class="usage-hint">
        提示：需要在浏览器页面上使用。点击「激活标尺」后切换到目标页面，移动鼠标即可查看元素信息。
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-ruler {
  padding: 28px 32px;
  max-width: 640px;
  overflow-y: auto;
  height: 100%;
}

.panel-header { margin-bottom: 24px; }
.panel-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0; }
.panel-desc { font-size: 13px; color: #9ca3af; margin: 6px 0 0; }

.intro-section { text-align: center; }

.feature-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; text-align: left; }
.feature-item { display: flex; gap: 12px; align-items: flex-start; padding: 12px 16px; background: #f9fafb; border-radius: 8px; }
.feature-icon { font-size: 24px; flex-shrink: 0; }
.feature-name { font-size: 14px; font-weight: 600; color: #374151; display: block; }
.feature-desc { font-size: 12px; color: #9ca3af; }

.btn-activate {
  padding: 14px 40px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.btn-activate:hover { transform: scale(1.02); box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
.btn-activate.active { background: linear-gradient(135deg, #ef4444, #dc2626); }

.status-msg { font-size: 13px; color: #6b7280; margin-bottom: 16px; }

.usage-hint { padding: 12px 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; font-size: 12px; color: #0369a1; text-align: left; }
</style>
