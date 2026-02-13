import type { MergedColorBoundaries } from './cellMerge';
import { mergeCellsByColor } from './cellMerge';
import { shouldRenderCell, toRenderedCellColor } from './cellRender';
import { simplifyMergedBoundaries } from './simplify';
import type { PathSimplificationAlgorithm, PipelineOutput } from './types';

export interface CellRenderPipelineOptions {
  blackAndWhiteCells: boolean;
  skipWhiteCells: boolean;
  combineSameColorCells: boolean;
  pathSimplificationAlgorithm: PathSimplificationAlgorithm;
  pathSimplificationStrength: number;
  pathSimplificationSizeCompensation: boolean;
  pathSimplificationMinPathSize01: number;
}

export interface CellRenderPipelineResult {
  polygons: PipelineOutput['cellPolygons'];
  colors: PipelineOutput['cellColors'];
  mergedOriginal: MergedColorBoundaries[] | null;
  mergedOptimized: MergedColorBoundaries[] | null;
}

export function computeCellRenderPipeline(
  pipelineOutput: PipelineOutput,
  options: CellRenderPipelineOptions
): CellRenderPipelineResult {
  const polygons: PipelineOutput['cellPolygons'] = [];
  const colors: PipelineOutput['cellColors'] = [];

  for (let i = 0; i < pipelineOutput.cellPolygons.length; i++) {
    const renderedColor = toRenderedCellColor(
      pipelineOutput.cellColors[i],
      options.blackAndWhiteCells
    );
    if (!shouldRenderCell(renderedColor, options)) continue;
    polygons.push(pipelineOutput.cellPolygons[i]);
    colors.push(renderedColor);
  }

  if (!options.combineSameColorCells) {
    return {
      polygons,
      colors,
      mergedOriginal: null,
      mergedOptimized: null,
    };
  }

  const minPathSize =
    Math.max(0, Math.min(1, options.pathSimplificationMinPathSize01)) *
    Math.min(pipelineOutput.imageWidth, pipelineOutput.imageHeight);

  const mergedOriginal = mergeCellsByColor(polygons, colors);
  const mergedOptimized = simplifyMergedBoundaries(mergedOriginal, {
    algorithm: options.pathSimplificationAlgorithm,
    strength: options.pathSimplificationStrength,
    sizeCompensation: options.pathSimplificationSizeCompensation,
    minPathSize,
  });

  return {
    polygons,
    colors,
    mergedOriginal,
    mergedOptimized,
  };
}
