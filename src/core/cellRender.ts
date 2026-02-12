import type { CellColor } from './types';

export interface CellRenderOptions {
  blackAndWhiteCells: boolean;
  skipWhiteCells: boolean;
}

export function toRenderedCellColor(
  color: CellColor,
  blackAndWhiteCells: boolean
): CellColor {
  if (!blackAndWhiteCells) {
    return color;
  }

  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  const value = luminance >= 128 ? 255 : 0;
  return {
    r: value,
    g: value,
    b: value,
    a: color.a,
  };
}

export function isWhiteCell(color: CellColor): boolean {
  return color.r === 255 && color.g === 255 && color.b === 255;
}

export function shouldRenderCell(color: CellColor, options: CellRenderOptions): boolean {
  if (!options.skipWhiteCells) {
    return true;
  }
  return !isWhiteCell(color);
}
