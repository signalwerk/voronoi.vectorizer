/**
 * Core type definitions for the Voronoi pipeline
 * These types are framework-agnostic and portable
 */

/**
 * Seed point in normalized coordinates [0, 1]
 */
export interface SeedPoint {
  x01: number;
  y01: number;
}

/**
 * Point in pixel coordinates
 */
export interface PixelPoint {
  x: number;
  y: number;
}

/**
 * RGBA color
 */
export interface CellColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Strategy for computing normalized area
 */
export type SeedStrategy = 'aspect' | 'maxAspect';

/**
 * Complete output from the Voronoi pipeline
 */
export interface PipelineOutput {
  imageWidth: number;
  imageHeight: number;
  seeds01: SeedPoint[];
  seedsPx: PixelPoint[];
  cellPolygons: PixelPoint[][];
  cellColors: CellColor[];
}

/**
 * Input configuration for the pipeline
 */
export interface PipelineInput {
  imageWidth: number;
  imageHeight: number;
  seedDensity: number;
  seedValue: string;
  seedStrategy: SeedStrategy;
  colorMode: 'cellAverage' | 'seedPoint';
  renderScale?: number;
}
