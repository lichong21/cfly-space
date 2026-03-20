export type DiffType = 'equal' | 'add' | 'remove';

export interface DiffLine {
  type: DiffType;
  text: string;
  oldLineNum?: number;
  newLineNum?: number;
}

export interface DiffStats {
  added: number;
  removed: number;
  equal: number;
}

/**
 * Simple line-based diff using LCS (Longest Common Subsequence).
 */
export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: 'equal', text: oldLines[i - 1], oldLineNum: i, newLineNum: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', text: newLines[j - 1], newLineNum: j });
      j--;
    } else {
      stack.push({ type: 'remove', text: oldLines[i - 1], oldLineNum: i });
      i--;
    }
  }

  // Reverse since we built bottom-up
  while (stack.length > 0) {
    result.push(stack.pop()!);
  }

  return result;
}

export function computeStats(diffs: DiffLine[]): DiffStats {
  return {
    added: diffs.filter(d => d.type === 'add').length,
    removed: diffs.filter(d => d.type === 'remove').length,
    equal: diffs.filter(d => d.type === 'equal').length,
  };
}
