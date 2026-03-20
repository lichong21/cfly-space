export interface ClipboardEntry {
  id: string;
  content: string;
  contentType: 'code' | 'url' | 'text' | 'number';
  sourceTitle: string;
  sourceUrl: string;
  isFavorite: boolean;
  createdAt: number;
}

export const STORAGE_KEY_CLIPBOARD = 'clipboardHistory';
export const MAX_CLIPBOARD_ENTRIES = 100;
