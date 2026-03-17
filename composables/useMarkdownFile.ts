import { ref } from 'vue';

export function useMarkdownFile() {
  const fileHandle = ref<FileSystemFileHandle | null>(null);
  const fileName = ref<string | null>(null);

  async function openFile(): Promise<{ content: string; name: string } | null> {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Markdown 文件',
            accept: { 'text/markdown': ['.md', '.markdown'] },
          },
        ],
      });
      fileHandle.value = handle;
      fileName.value = handle.name;
      const file = await handle.getFile();
      const content = await file.text();
      return { content, name: handle.name };
    } catch {
      // User cancelled
      return null;
    }
  }

  async function saveFile(content: string): Promise<boolean> {
    if (!fileHandle.value) {
      return saveFileAs(content);
    }
    try {
      const writable = await fileHandle.value.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  }

  async function saveFileAs(content: string, suggestedName?: string): Promise<boolean> {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName || 'untitled.md',
        types: [
          {
            description: 'Markdown 文件',
            accept: { 'text/markdown': ['.md'] },
          },
        ],
      });
      fileHandle.value = handle;
      fileName.value = handle.name;
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  }

  return { fileHandle, fileName, openFile, saveFile, saveFileAs };
}
