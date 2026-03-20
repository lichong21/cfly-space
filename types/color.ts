export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a: number;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[]; // HEX values
}

export interface ColorState {
  palettes: ColorPalette[];
}

export const STORAGE_KEY_COLOR = 'colorPalettes';

export const DEFAULT_COLOR_STATE: ColorState = {
  palettes: [
    { id: 'default', name: '常用色', colors: [] },
  ],
};
