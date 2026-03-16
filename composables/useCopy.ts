import { ref } from 'vue';

export function useCopy() {
  const copied = ref(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    } catch {
      // Fallback for older browsers / extension context
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    }
  }

  return { copied, copy };
}
