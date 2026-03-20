<script lang="ts" setup>
import { ref, watch } from 'vue';
import CodecLayout from './CodecLayout.vue';

const input = ref('');
const output = ref('');
const error = ref('');
const filePreview = ref('');

function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
}

function base64ToUtf8(str: string): string {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
}

function encode() {
  try {
    error.value = '';
    filePreview.value = '';
    output.value = utf8ToBase64(input.value);
  } catch (e) {
    error.value = `编码失败：${(e as Error).message}`;
  }
}

function decode() {
  try {
    error.value = '';
    const cleaned = input.value.trim();
    output.value = base64ToUtf8(cleaned);

    // Check if it's an image
    if (cleaned.startsWith('data:image')) {
      filePreview.value = cleaned;
    } else {
      // Try to detect if decoded content looks like binary (image)
      filePreview.value = '';
    }
  } catch (e) {
    error.value = `解码失败：非法的 Base64 字符串`;
  }
}

watch(input, () => {
  if (input.value) encode();
  else { output.value = ''; error.value = ''; filePreview.value = ''; }
});

function swap() {
  const tmp = output.value;
  input.value = tmp;
  filePreview.value = '';
}

async function handleFileSelect() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      output.value = dataUri;
      input.value = `[文件] ${file.name} (${formatSize(file.size)})`;

      if (file.type.startsWith('image/')) {
        filePreview.value = dataUri;
      }
    };
    reader.readAsDataURL(file);
  };
  fileInput.click();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <div>
    <div class="file-row">
      <button class="btn-file" @click="handleFileSelect">选择文件转 Base64</button>
    </div>
    <CodecLayout
      :input="input"
      :output="output"
      :error="error"
      @update:input="input = $event"
      @swap="swap"
    >
      <template #actions>
        <button class="btn-action encode" @click="encode">Encode ↓</button>
        <button class="btn-action decode" @click="decode">Decode ↑</button>
      </template>
    </CodecLayout>
    <div v-if="filePreview" class="preview-area">
      <span class="preview-label">图片预览</span>
      <img :src="filePreview" class="preview-img" alt="preview" />
    </div>
  </div>
</template>

<style scoped>
.file-row {
  margin-bottom: 8px;
}

.btn-file {
  padding: 6px 14px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-file:hover {
  border-color: #1a73e8;
  color: #1a73e8;
  background: #f0f4ff;
}

.btn-action {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-action.encode {
  background: #1a73e8;
  color: #fff;
}

.btn-action.encode:hover {
  background: #1557b0;
}

.btn-action.decode {
  background: #e5e7eb;
  color: #374151;
}

.btn-action.decode:hover {
  background: #d1d5db;
}

.preview-area {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #f9fafb;
}

.preview-label {
  font-size: 11px;
  color: #9ca3af;
  display: block;
  margin-bottom: 8px;
}

.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}
</style>
