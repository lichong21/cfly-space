import { ref } from 'vue';

export function useMarkdownFile() {
  const fileName = ref<string | null>(null);

  function openFile(): Promise<{ content: string; name: string } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown,text/markdown';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        fileName.value = file.name;
        const content = await file.text();
        resolve({ content, name: file.name });
      });
      // User cancelled (input won't fire change if cancelled, but we handle it gracefully)
      input.click();
    });
  }

  function saveFile(content: string, suggestedName?: string): boolean {
    const name = suggestedName || fileName.value || 'untitled.md';
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  return { fileName, openFile, saveFile };
}
