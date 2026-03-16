import type { WaterConfig, WaterState, WaterMessage, WaterStatus } from '@/types/water';
import { DEFAULT_WATER_CONFIG, DEFAULT_WATER_STATE } from '@/types/water';

const MENU_PARENT_ID = 'cfly-space';
const MENU_JSON_ID = 'cfly-space-json';

const ALARM_NAME = 'water-reminder';
const ALARM_ENHANCED = 'water-reminder-enhanced';
const NOTIFICATION_ID = 'water-reminder-notification';
const STORAGE_KEY_CONFIG = 'waterConfig';
const STORAGE_KEY_STATE = 'waterState';

export default defineBackground(() => {
  console.log('CFly Space background service started', { id: browser.runtime.id });

  // ---- Helpers ----

  async function getConfig(): Promise<WaterConfig> {
    const result = await chrome.storage.local.get(STORAGE_KEY_CONFIG);
    const saved = result[STORAGE_KEY_CONFIG] as Partial<WaterConfig> | undefined;
    return { ...DEFAULT_WATER_CONFIG, ...saved };
  }

  async function getState(): Promise<WaterState> {
    const result = await chrome.storage.local.get(STORAGE_KEY_STATE);
    const saved = result[STORAGE_KEY_STATE] as Partial<WaterState> | undefined;
    const state: WaterState = { ...DEFAULT_WATER_STATE, ...saved };
    // 跨天重置
    if (state.todayDate !== new Date().toDateString()) {
      state.todayCount = 0;
      state.todayDate = new Date().toDateString();
    }
    return state;
  }

  async function saveState(state: WaterState) {
    await chrome.storage.local.set({ [STORAGE_KEY_STATE]: state });
  }

  function isInWorkHours(config: WaterConfig): boolean {
    const hour = new Date().getHours();
    return hour >= config.startHour && hour < config.endHour;
  }

  // ---- Alarm Management ----

  async function createAlarm(config?: WaterConfig) {
    if (!config) config = await getConfig();
    await chrome.alarms.clear(ALARM_NAME);
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: config.interval,
      periodInMinutes: config.interval,
    });
  }

  async function clearAlarms() {
    await chrome.alarms.clear(ALARM_NAME);
    await chrome.alarms.clear(ALARM_ENHANCED);
  }

  // ---- Notification ----

  async function showNotification() {
    const config = await getConfig();
    const state = await getState();

    // 检查工作时段
    if (!isInWorkHours(config)) return;

    // 检查暂停状态
    if (state.pausedUntil && Date.now() < state.pausedUntil) return;

    // 清除过期的暂停
    if (state.pausedUntil && Date.now() >= state.pausedUntil) {
      state.pausedUntil = null;
      await saveState(state);
    }

    // 更新计数
    state.todayCount++;
    await saveState(state);

    chrome.notifications.create(NOTIFICATION_ID, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('/icon/128.png'),
      title: '💧 该喝水啦！',
      message: `今天已提醒 ${state.todayCount} 次，保持健康，记得喝水~`,
      buttons: [{ title: '✓ 已喝水' }],
      priority: 2,
      requireInteraction: config.enhancedMode,
    });

    // 增强模式：5 分钟后重新提醒
    if (config.enhancedMode) {
      await chrome.alarms.clear(ALARM_ENHANCED);
      await chrome.alarms.create(ALARM_ENHANCED, { delayInMinutes: 5 });
    }
  }

  // ---- Context Menu ----

  // 每次 Service Worker 启动时重新创建菜单（MV3 SW 重启后菜单会丢失）
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_PARENT_ID,
      title: 'CFly Space',
      contexts: ['all'],
    });
    chrome.contextMenus.create({
      id: MENU_JSON_ID,
      parentId: MENU_PARENT_ID,
      title: 'JSON 格式化',
      contexts: ['all'],
    });
  });

  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === MENU_JSON_ID) {
      // 打开 options 页面并定位到 JSON 格式化标签
      chrome.tabs.create({ url: chrome.runtime.getURL('/options.html#json') });
    }
  });

  // ---- Event Listeners ----

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
      await showNotification();
    } else if (alarm.name === ALARM_ENHANCED) {
      // 增强模式重新提醒
      await showNotification();
    }
  });

  chrome.notifications.onButtonClicked.addListener(async (notifId, buttonIndex) => {
    if (notifId === NOTIFICATION_ID && buttonIndex === 0) {
      // 用户点击"已喝水"，清除增强提醒
      await chrome.alarms.clear(ALARM_ENHANCED);
      chrome.notifications.clear(NOTIFICATION_ID);
    }
  });

  chrome.notifications.onClicked.addListener((notifId) => {
    if (notifId === NOTIFICATION_ID) {
      chrome.notifications.clear(NOTIFICATION_ID);
    }
  });

  // ---- Message Handler ----

  chrome.runtime.onMessage.addListener((message: WaterMessage, _sender, sendResponse) => {
    if (message.type !== 'water') return false;

    const handler = async () => {
      const config = message.payload?.config || await getConfig();

      switch (message.action) {
        case 'start': {
          await createAlarm(config);
          break;
        }
        case 'stop': {
          await clearAlarms();
          break;
        }
        case 'pause': {
          await clearAlarms();
          const minutes = message.payload?.pauseMinutes || 30;
          // 暂停结束后重新创建 alarm
          await chrome.alarms.create(ALARM_NAME, { delayInMinutes: minutes });
          break;
        }
        case 'skip': {
          // 清除当前 alarm，重新创建
          await clearAlarms();
          await createAlarm(config);
          break;
        }
        case 'trigger': {
          await showNotification();
          break;
        }
        case 'getStatus': {
          const state = await getState();
          const alarm = await chrome.alarms.get(ALARM_NAME);
          const status: WaterStatus = {
            enabled: state.enabled,
            pausedUntil: state.pausedUntil,
            todayCount: state.todayCount,
            nextAlarmTime: alarm?.scheduledTime || null,
          };
          sendResponse(status);
          return;
        }
      }
      sendResponse({ ok: true });
    };

    handler();
    return true; // keep message channel open for async response
  });
});
