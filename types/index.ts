export type IndentType = '2' | '4' | 'tab';

export type ViewMode = 'text' | 'tree';

export interface JsonValidationError {
  message: string;
  line: number;
  column: number;
}

export interface JsonTreeNodeData {
  key: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  children?: JsonTreeNodeData[];
  length?: number;
}
