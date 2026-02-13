/**
 * Color sampling from image data
 * Supports two modes: seed point sampling and cell average
 */
import type { Delaunay } from "d3-delaunay";
import type { CellColor, PixelPoint } from "./types";

/**
 * Interface for accessing pixel data
 */
export interface ImageDataLike {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA format
}

/**
 * Sample color at a single pixel location
 * Uses nearest-neighbor sampling
 *
 * @param imageData - Image pixel data
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns RGBA color
 */
function samplePixel(
  imageData: ImageDataLike,
  x: number,
  y: number,
): CellColor {
  const px = Math.floor(x);
  const py = Math.floor(y);

  // Clamp to image bounds
  const cx = Math.max(0, Math.min(imageData.width - 1, px));
  const cy = Math.max(0, Math.min(imageData.height - 1, py));

  const index = (cy * imageData.width + cx) * 4;

  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3],
  };
}

/**
 * Sample colors at seed point locations
 *
 * @param imageData - Image pixel data
 * @param seedsPx - Seed points in pixel coordinates
 * @returns Array of colors, one per seed
 */
export function sampleSeedColors(
  imageData: ImageDataLike,
  seedsPx: PixelPoint[],
): CellColor[] {
  return seedsPx.map((seed) => samplePixel(imageData, seed.x, seed.y));
}

/**
 * Compute average color for each Voronoi cell
 * Uses Delaunay.find() for efficient nearest-site queries
 *
 * @param imageData - Image pixel data
 * @param delaunay - Delaunay triangulation
 * @param scale - Optional downscaling factor for performance (0.5 = half resolution)
 * @returns Array of average colors, one per cell
 */
export function computeCellAverageColors(
  imageData: ImageDataLike,
  delaunay: Delaunay<number[]>,
  scale: number = 1.0,
): CellColor[] {
  const width = imageData.width;
  const height = imageData.height;
  const numCells = delaunay.points.length / 2;

  // Initialize accumulators for each cell
  const sumR = new Float64Array(numCells);
  const sumG = new Float64Array(numCells);
  const sumB = new Float64Array(numCells);
  const sumA = new Float64Array(numCells);
  const count = new Uint32Array(numCells);

  // Determine sampling step based on scale
  const step = Math.max(1, Math.round(1 / scale));

  // Iterate over all pixels (or sampled pixels)
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      // Find nearest seed index
      const cellIndex = delaunay.find(x, y);

      // Sample pixel color
      const index = (y * width + x) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      const a = imageData.data[index + 3];

      // Accumulate
      sumR[cellIndex] += r;
      sumG[cellIndex] += g;
      sumB[cellIndex] += b;
      sumA[cellIndex] += a;
      count[cellIndex]++;
    }
  }

  // Compute averages
  const colors: CellColor[] = [];
  for (let i = 0; i < numCells; i++) {
    const c = count[i] || 1; // Avoid division by zero
    colors.push({
      r: Math.round(sumR[i] / c),
      g: Math.round(sumG[i] / c),
      b: Math.round(sumB[i] / c),
      a: Math.round(sumA[i] / c),
    });
  }

  return colors;
}
