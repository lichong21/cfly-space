<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWaterStore } from '@/stores/water';

const store = useWaterStore();

const intervalOptions = [
  { value: 30, label: '30 分钟' },
  { value: 45, label: '45 分钟' },
  { value: 60, label: '60 分钟' },
  { value: 90, label: '90 分钟' },
];

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`,
}));

const pauseOptions = [
  { minutes: 15, label: '15 分钟' },
  { minutes: 30, label: '30 分钟' },
  { minutes: 60, label: '1 小时' },
];

// 倒计时显示
const countdown = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

function updateCountdown() {
  if (!store.state.enabled || !store.nextAlarmTime) {
    countdown.value = '';
    return;
  }
  if (store.isPaused) {
    const remaining = store.state.pausedUntil! - Date.now();
    if (remaining <= 0) {
      countdown.value = '暂停已结束';
      return;
    }
    countdown.value = `暂停中 (${formatDuration(remaining)})`;
    return;
  }
  const remaining = store.nextAlarmTime - Date.now();
  if (remaining <= 0) {
    countdown.value = '即将提醒...';
    return;
  }
  countdown.value = formatDuration(remaining);
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min} 分 ${sec} 秒`;
  return `${sec} 秒`;
}

onMounted(() => {
  store.refreshStatus();
  timer = setInterval(() => {
    store.refreshStatus();
    updateCountdown();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="water-reminder">
    <div class="panel-header">
      <div class="panel-title-row">
        <h2 class="panel-title">喝水提醒</h2>
        <label class="switch">
          <input
            type="checkbox"
            :checked="store.state.enabled"
            @change="store.toggleEnabled()"
          />
          <span class="slider" />
        </label>
      </div>
      <p class="panel-desc">定时提醒你喝水，保持健康好习惯</p>
    </div>

    <!-- Status Bar -->
    <div v-if="store.state.enabled" class="status-bar">
      <div class="status-item">
        <span class="status-label">下次提醒</span>
        <span class="status-value">{{ countdown || '计算中...' }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">今日次数</span>
        <span class="status-value highlight">{{ store.state.todayCount }} 次</span>
      </div>
    </div>

    <!-- Quick Actions -->
    <div v-if="store.state.enabled" class="section">
      <h3 class="section-title">快捷操作</h3>
      <div class="action-row">
        <button class="btn btn-primary" @click="store.triggerNow()">
          立即提醒
        </button>
        <button class="btn btn-secondary" @click="store.skip()">
          跳过本次
        </button>
        <template v-if="!store.isPaused">
          <button
            v-for="opt in pauseOptions"
            :key="opt.minutes"
            class="btn btn-outline"
            @click="store.pause(opt.minutes)"
          >
            暂停 {{ opt.label }}
          </button>
        </template>
        <button v-else class="btn btn-secondary" @click="store.resume()">
          恢复提醒
        </button>
      </div>
    </div>

    <!-- Config -->
    <div class="section">
      <h3 class="section-title">提醒设置</h3>

      <div class="config-item">
        <div class="config-label">
          <span class="config-name">提醒间隔</span>
          <span class="config-desc">每隔多久提醒一次</span>
        </div>
        <div class="config-control">
          <select
            :value="store.config.interval"
            @change="store.updateConfig({ interval: Number(($event.target as HTMLSelectElement).value) })"
          >
            <option v-for="opt in intervalOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="config-item">
        <div class="config-label">
          <span class="config-name">工作时段</span>
          <span class="config-desc">仅在工作时段内提醒</span>
        </div>
        <div class="config-control time-range">
          <select
            :value="store.config.startHour"
            @change="store.updateConfig({ startHour: Number(($event.target as HTMLSelectElement).value) })"
          >
            <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <span class="time-sep">至</span>
          <select
            :value="store.config.endHour"
            @change="store.updateConfig({ endHour: Number(($event.target as HTMLSelectElement).value) })"
          >
            <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="config-item">
        <div class="config-label">
          <span class="config-name">增强提醒</span>
          <span class="config-desc">未确认时 5 分钟后重复提醒</span>
        </div>
        <div class="config-control">
          <label class="switch small">
            <input
              type="checkbox"
              :checked="store.config.enhancedMode"
              @change="store.updateConfig({ enhancedMode: !store.config.enhancedMode })"
            />
            <span class="slider" />
          </label>
        </div>
      </div>

      <div class="config-item">
        <div class="config-label">
          <span class="config-name">声音提醒</span>
          <span class="config-desc">提醒时播放提示音</span>
        </div>
        <div class="config-control">
          <label class="switch small">
            <input
              type="checkbox"
              :checked="store.config.soundEnabled"
              @change="store.updateConfig({ soundEnabled: !store.config.soundEnabled })"
            />
            <span class="slider" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.water-reminder {
  padding: 28px 32px;
  max-width: 640px;
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
}

.status-value.highlight {
  color: #0369a1;
}

/* ---- Sections ---- */
.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px;
}

/* ---- Actions ---- */
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

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

.btn-outline {
  background: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* ---- Config Items ---- */
.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #f3f4f6;
}

.config-item:last-child {
  border-bottom: none;
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

.config-desc {
  font-size: 12px;
  color: #9ca3af;
}

.config-control {
  flex-shrink: 0;
}

.config-control select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #fff;
  cursor: pointer;
  outline: none;
}

.config-control select:focus {
  border-color: #1a73e8;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-sep {
  font-size: 13px;
  color: #9ca3af;
}

/* ---- Toggle Switch ---- */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch.small {
  width: 38px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #d1d5db;
  border-radius: 24px;
  transition: 0.2s;
}

.slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}

.switch.small .slider::before {
  height: 14px;
  width: 14px;
}

.switch input:checked + .slider {
  background: #1a73e8;
}

.switch input:checked + .slider::before {
  transform: translateX(20px);
}

.switch.small input:checked + .slider::before {
  transform: translateX(18px);
}
</style>
