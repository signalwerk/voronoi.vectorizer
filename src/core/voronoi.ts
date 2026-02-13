/**
 * Voronoi diagram construction using d3-delaunay
 */
import { Delaunay } from "d3-delaunay";
import type { PixelPoint } from "./types";

export interface VoronoiResult {
  delaunay: Delaunay<number[]>;
  cellPolygons: PixelPoint[][];
}

/**
 * Build a Voronoi diagram from seed points
 *
 * @param seedsPx - Seed points in pixel coordinates
 * @param width - Image width (bounds)
 * @param height - Image height (bounds)
 * @returns Delaunay triangulation and cell polygons
 */
export function buildVoronoi(
  seedsPx: PixelPoint[],
  width: number,
  height: number,
): VoronoiResult {
  // Convert to array of [x, y] tuples for d3-delaunay
  const points: [number, number][] = seedsPx.map((seed) => [seed.x, seed.y]);

  // Construct Delaunay triangulation
  const delaunay = Delaunay.from(points);

  // Create Voronoi diagram bounded to image rectangle
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  // Extract cell polygons
  const cellPolygons: PixelPoint[][] = [];
  for (let i = 0; i < seedsPx.length; i++) {
    const cell = voronoi.cellPolygon(i);
    if (cell) {
      cellPolygons.push(cell.map(([x, y]: [number, number]) => ({ x, y })));
    } else {
      // Fallback for invalid cells (shouldn't happen)
      cellPolygons.push([]);
    }
  }

  return { delaunay, cellPolygons };
}
