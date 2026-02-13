import { mergeCellsByColor } from './cellMerge';
import { shouldRenderCell, toRenderedCellColor } from './cellRender';
import { simplifyMergedBoundaries } from './simplify';
import type { PathSimplificationAlgorithm, PipelineOutput } from './types';

export interface SimplificationStatsOptions {
  blackAndWhiteCells: boolean;
  skipWhiteCells: boolean;
  combineSameColorCells: boolean;
  pathSimplificationAlgorithm: PathSimplificationAlgorithm;
  pathSimplificationStrength: number;
  pathSimplificationSizeCompensation: boolean;
  pathSimplificationMinPathSize01: number;
}

export interface SimplificationPointStats {
  originalPoints: number;
  optimizedPoints: number;
}

export function computeSimplificationPointStats(
  pipelineOutput: PipelineOutput,
  options: SimplificationStatsOptions
): SimplificationPointStats | null {
  if (!options.combineSameColorCells) return null;
  if (options.pathSimplificationAlgorithm === 'none') return null;

  const renderPolygons: PipelineOutput['cellPolygons'] = [];
  const renderColors: PipelineOutput['cellColors'] = [];

  for (let i = 0; i < pipelineOutput.cellPolygons.length; i++) {
    const renderedColor = toRenderedCellColor(
      pipelineOutput.cellColors[i],
      options.blackAndWhiteCells
    );
    if (!shouldRenderCell(renderedColor, options)) continue;
    renderPolygons.push(pipelineOutput.cellPolygons[i]);
    renderColors.push(renderedColor);
  }

  const merged = mergeCellsByColor(renderPolygons, renderColors);
  const simplified = simplifyMergedBoundaries(merged, {
    algorithm: options.pathSimplificationAlgorithm,
    strength: options.pathSimplificationStrength,
    sizeCompensation: options.pathSimplificationSizeCompensation,
    minPathSize:
      Math.max(0, Math.min(1, options.pathSimplificationMinPathSize01)) *
      Math.min(pipelineOutput.imageWidth, pipelineOutput.imageHeight),
  });

  const originalPoints = merged.reduce(
    (sum, group) => sum + group.rings.reduce((ringSum, ring) => ringSum + ring.length, 0),
    0
  );
  const optimizedPoints = simplified.reduce(
    (sum, group) => sum + group.rings.reduce((ringSum, ring) => ringSum + ring.length, 0),
    0
  );

  return { originalPoints, optimizedPoints };
}
