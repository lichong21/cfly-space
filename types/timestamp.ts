export interface TimestampRecord {
  id: string;
  input: string;
  inputType: InputType;
  resultSeconds: number;
  resultLocal: string;
  createdAt: number;
}

export interface TimestampResult {
  seconds: number;
  milliseconds: number;
  iso8601: string;
  local: string;
  utc: string;
  relative: string;
}

export type InputType = 'timestamp' | 'datetime' | 'unknown';

export type ConvertMode = 'single' | 'batch';

export interface DurationParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const MAX_HISTORY_COUNT = 10;

export const STORAGE_KEY_TIMESTAMP_HISTORY = 'timestampHistory';
