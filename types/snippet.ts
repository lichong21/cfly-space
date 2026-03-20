export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  folderId: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SnippetFolder {
  id: string;
  name: string;
  order: number;
}

export interface SnippetState {
  snippets: Snippet[];
  folders: SnippetFolder[];
}

export const STORAGE_KEY_SNIPPETS = 'snippetState';

export const DEFAULT_FOLDER_ID = 'all';

export const LANGUAGE_OPTIONS = [
  'javascript', 'typescript', 'python', 'go', 'rust', 'java',
  'sql', 'shell', 'html', 'css', 'json', 'yaml', 'markdown',
  'c', 'cpp', 'csharp', 'php', 'ruby', 'swift', 'kotlin', 'other',
];
