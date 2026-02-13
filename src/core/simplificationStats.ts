import { computeCellRenderPipeline } from "./cellRenderPipeline";
import type { PathSimplificationAlgorithm, PipelineOutput } from "./types";

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
  options: SimplificationStatsOptions,
): SimplificationPointStats | null {
  if (!options.combineSameColorCells) return null;
  if (options.pathSimplificationAlgorithm === "none") return null;

  const cellRender = computeCellRenderPipeline(pipelineOutput, options);
  const merged = cellRender.mergedOriginal ?? [];
  const simplified = cellRender.mergedOptimized ?? [];

  const originalPoints = merged.reduce(
    (sum, group) =>
      sum + group.rings.reduce((ringSum, ring) => ringSum + ring.length, 0),
    0,
  );
  const optimizedPoints = simplified.reduce(
    (sum, group) =>
      sum + group.rings.reduce((ringSum, ring) => ringSum + ring.length, 0),
    0,
  );

  return { originalPoints, optimizedPoints };
}
