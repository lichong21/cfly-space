export interface RegexMatch {
  index: number;
  text: string;
  groups: Array<{ name: string | null; value: string }>;
}

export interface RegexTemplate {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  category: 'validate' | 'extract' | 'format' | 'custom';
  isBuiltin: boolean;
}

export const BUILTIN_TEMPLATES: Omit<RegexTemplate, 'id'>[] = [
  { name: '邮箱地址', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+', flags: 'g', category: 'validate', isBuiltin: true },
  { name: '手机号（中国）', pattern: '1[3-9]\\d{9}', flags: 'g', category: 'validate', isBuiltin: true },
  { name: 'IPv4 地址', pattern: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}', flags: 'g', category: 'extract', isBuiltin: true },
  { name: 'URL', pattern: 'https?://[\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=]+', flags: 'g', category: 'extract', isBuiltin: true },
  { name: 'HTML 标签', pattern: '<([a-z]+)([^>]*)>(.*?)</\\1>', flags: 'gi', category: 'extract', isBuiltin: true },
  { name: '日期 YYYY-MM-DD', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g', category: 'format', isBuiltin: true },
  { name: '十六进制颜色', pattern: '#[0-9a-fA-F]{3,8}', flags: 'g', category: 'extract', isBuiltin: true },
  { name: '中文字符', pattern: '[\\u4e00-\\u9fa5]+', flags: 'g', category: 'extract', isBuiltin: true },
];

export const REGEX_STORAGE_KEY = 'regexCustomTemplates';

export const CATEGORY_LABELS: Record<string, string> = {
  validate: '验证类',
  extract: '提取类',
  format: '格式类',
  custom: '自定义',
};
