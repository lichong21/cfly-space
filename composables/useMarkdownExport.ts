import { useCopy } from './useCopy';

export function useMarkdownExport() {
  const { copied, copy } = useCopy();

  async function copyMarkdown(content: string) {
    await copy(content);
  }

  async function copyHtml(html: string) {
    await copy(html);
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportMarkdown(content: string, title: string) {
    const filename = `${title || 'untitled'}.md`;
    downloadFile(content, filename, 'text/markdown;charset=utf-8');
  }

  function exportHtml(html: string, title: string) {
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.7; color: #333; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding: 0 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; }
    img { max-width: 100%; }
  </style>
</head>
<body>${html}</body>
</html>`;
    const filename = `${title || 'untitled'}.html`;
    downloadFile(fullHtml, filename, 'text/html;charset=utf-8');
  }

  return { copied, copyMarkdown, copyHtml, exportMarkdown, exportHtml };
}
