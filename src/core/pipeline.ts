/**
 * Main Voronoi pipeline orchestration
 * Pure functional pipeline - no DOM/React dependencies
 */
import { computeSeedCount, generateSeeds, seedsToPixels } from './seedGeneration';
import { buildVoronoi } from './voronoi';
import { sampleSeedColors, computeCellAverageColors } from './colorSampling';
import type { PipelineInput, PipelineOutput } from './types';
import type { ImageDataLike } from './colorSampling';

/**
 * Interface for pixel data access (adapter pattern)
 */
export interface PixelSource {
  width: number;
  height: number;
  getImageData(): ImageDataLike;
}

/**
 * Run the complete Voronoi pipeline
 * 
 * @param input - Pipeline configuration
 * @param pixelSource - Source for pixel data (adapter)
 * @returns Complete pipeline output ready for rendering
 */
export function runPipeline(
  input: PipelineInput,
  pixelSource: PixelSource
): PipelineOutput {
  // 1. Compute seed count
  const seedCount = computeSeedCount(
    input.imageWidth,
    input.imageHeight,
    input.seedDensity,
    input.seedStrategy
  );
  
  // 2. Generate seeds in normalized coordinates
  const seeds01 = generateSeeds(seedCount, input.seedValue);
  
  // 3. Convert to pixel coordinates
  const seedsPx = seedsToPixels(seeds01, input.imageWidth, input.imageHeight);
  
  // 4. Build Voronoi diagram
  const { delaunay, cellPolygons } = buildVoronoi(
    seedsPx,
    input.imageWidth,
    input.imageHeight
  );
  
  // 5. Sample colors based on mode
  const imageData = pixelSource.getImageData();
  let cellColors;
  
  if (input.colorMode === 'seedPoint') {
    cellColors = sampleSeedColors(imageData, seedsPx);
  } else {
    // cellAverage mode
    const scale = input.renderScale ?? 1.0;
    cellColors = computeCellAverageColors(imageData, delaunay, scale);
  }
  
  // 6. Return complete output
  return {
    imageWidth: input.imageWidth,
    imageHeight: input.imageHeight,
    seeds01,
    seedsPx,
    cellPolygons,
    cellColors,
  };
}
