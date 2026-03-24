<script lang="ts" setup>
import { watch, ref } from 'vue';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, parserCtx } from '@milkdown/kit/core';
import { Milkdown, useEditor } from '@milkdown/vue';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { history } from '@milkdown/kit/plugin/history';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { cursor } from '@milkdown/kit/plugin/cursor';
import { indent } from '@milkdown/kit/plugin/indent';
import { prism, prismConfig } from '@milkdown/plugin-prism';
import { refractor } from 'refractor';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// Flag to suppress emitting during external content replacement
const suppressEmit = ref(false);

const { get } = useEditor((root) =>
  Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(defaultValueCtx, props.modelValue);
      ctx.set(prismConfig.key, { configureRefractor: () => refractor });
      ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
        if (!suppressEmit.value) {
          emit('update:modelValue', markdown);
        }
      });
    })
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(listener)
    .use(clipboard)
    .use(cursor)
    .use(indent)
    .use(prism),
);

/**
 * Replace editor content when modelValue changes externally (e.g. note switch).
 */
function replaceContent(markdown: string) {
  const editor = get();
  if (!editor) return;
  try {
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const parser = ctx.get(parserCtx);
      const doc = parser(markdown);
      if (!doc) return;
      suppressEmit.value = true;
      const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content);
      view.dispatch(tr);
      suppressEmit.value = false;
    });
  } catch {
    // Editor not ready yet, ignore
  }
}

defineExpose({ get, replaceContent });
</script>

<template>
  <Milkdown />
</template>

<style>
/* Milkdown editor styles */
.milkdown {
  height: 100%;
  overflow-y: auto;
}

.milkdown .editor {
  padding: 24px 32px;
  outline: none;
  min-height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.7;
  color: #333;
}

.milkdown .editor h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 24px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.milkdown .editor h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 20px 0 10px;
}

.milkdown .editor h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 16px 0 8px;
}

.milkdown .editor h4,
.milkdown .editor h5,
.milkdown .editor h6 {
  font-size: 15px;
  font-weight: 600;
  margin: 12px 0 6px;
}

.milkdown .editor p {
  margin: 8px 0;
}

.milkdown .editor blockquote {
  border-left: 4px solid #667eea;
  margin: 12px 0;
  padding: 4px 16px;
  color: #666;
  background: #f8f9ff;
  border-radius: 0 4px 4px 0;
}

.milkdown .editor pre {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
  font-size: 13px;
}

.milkdown .editor code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.milkdown .editor pre code {
  background: none;
  padding: 0;
}

.milkdown .editor ul,
.milkdown .editor ol {
  padding-left: 24px;
  margin: 8px 0;
}

.milkdown .editor li {
  margin: 4px 0;
}

.milkdown .editor table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.milkdown .editor th,
.milkdown .editor td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.milkdown .editor th {
  background: #f6f8fa;
  font-weight: 600;
}

.milkdown .editor hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 20px 0;
}

.milkdown .editor a {
  color: #667eea;
  text-decoration: none;
}

.milkdown .editor a:hover {
  text-decoration: underline;
}

.milkdown .editor img {
  max-width: 100%;
  border-radius: 4px;
}

.milkdown .editor strong {
  font-weight: 600;
}

.milkdown .editor .task-list-item {
  list-style: none;
  margin-left: -24px;
}

.milkdown .editor .task-list-item input[type="checkbox"] {
  margin-right: 8px;
}
</style>
