import type { IndentType, JsonValidationError } from '@/types';

function getIndentString(indent: IndentType): string | number {
  if (indent === 'tab') return '\t';
  return Number(indent);
}

export function formatJson(input: string, indent: IndentType = '2'): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, getIndentString(indent));
}

export function compressJson(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

export function validateJson(input: string): JsonValidationError | null {
  try {
    JSON.parse(input);
    return null;
  } catch (e) {
    const err = e as SyntaxError;
    const msg = err.message;

    // Try to extract position info from error message
    // Common format: "... at position 42" or "... at line 3 column 5"
    let line = 1;
    let column = 1;

    const posMatch = msg.match(/at position (\d+)/);
    if (posMatch) {
      const pos = Number(posMatch[1]);
      const lines = input.substring(0, pos).split('\n');
      line = lines.length;
      column = (lines[lines.length - 1]?.length ?? 0) + 1;
    }

    const lineColMatch = msg.match(/line (\d+) column (\d+)/);
    if (lineColMatch) {
      line = Number(lineColMatch[1]);
      column = Number(lineColMatch[2]);
    }

    return {
      message: msg,
      line,
      column,
    };
  }
}

export function highlightJson(json: string): string {
  return json.replace(
    /("(?:\\.|[^"\\])*")\s*(:)?|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, str: string | undefined, colon: string | undefined, bool: string | undefined, num: string | undefined) => {
      if (str) {
        if (colon) {
          // Key
          return `<span class="json-key">${escapeHtml(str)}</span>:`;
        }
        // String value
        return `<span class="json-string">${escapeHtml(str)}</span>`;
      }
      if (bool) {
        return `<span class="json-boolean">${bool}</span>`;
      }
      if (num) {
        return `<span class="json-number">${num}</span>`;
      }
      return match;
    },
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
