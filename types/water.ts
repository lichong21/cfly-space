export interface WaterConfig {
  interval: number;          // 提醒间隔（分钟），默认 60
  startHour: number;         // 工作开始时间，默认 9
  endHour: number;           // 工作结束时间，默认 18
  soundEnabled: boolean;     // 声音提醒，默认 false
  enhancedMode: boolean;     // 增强提醒模式，默认 false
}

export interface WaterState {
  enabled: boolean;          // 总开关
  pausedUntil: number | null; // 暂停截止时间戳
  todayCount: number;        // 今日提醒次数
  todayDate: string;         // 今日日期（用于跨天重置）
}

export type WaterMessageAction = 'start' | 'stop' | 'pause' | 'skip' | 'trigger' | 'getStatus';

export interface WaterMessage {
  type: 'water';
  action: WaterMessageAction;
  payload?: {
    config?: WaterConfig;
    pauseMinutes?: number;
  };
}

export interface WaterStatus {
  enabled: boolean;
  pausedUntil: number | null;
  todayCount: number;
  nextAlarmTime: number | null;
}

export const DEFAULT_WATER_CONFIG: WaterConfig = {
  interval: 60,
  startHour: 9,
  endHour: 18,
  soundEnabled: false,
  enhancedMode: false,
};

export const DEFAULT_WATER_STATE: WaterState = {
  enabled: false,
  pausedUntil: null,
  todayCount: 0,
  todayDate: new Date().toDateString(),
};
