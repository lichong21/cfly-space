export interface Note {
  id: string;            // 唯一标识（UUID）
  title: string;         // 笔记标题
  content: string;       // Markdown 内容
  createdAt: number;     // 创建时间戳
  updatedAt: number;     // 更新时间戳
}

export interface MarkdownState {
  notes: Note[];
  activeNoteId: string | null;
}

export const DEFAULT_NOTE_CONTENT = `# 欢迎使用 Markdown 编辑器

开始编写你的笔记吧！

## 功能特性

- **所见即所得** 编辑
- 支持 GFM 语法
- 代码高亮
- 大纲导航
- 本地文件读写

> 提示：使用左侧面板管理笔记，使用右侧面板浏览大纲。
`;

export const DEFAULT_MARKDOWN_STATE: MarkdownState = {
  notes: [],
  activeNoteId: null,
};
