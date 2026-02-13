import { computeCellRenderPipeline } from "./cellRenderPipeline";
import { fractionToPx, RENDER_CONFIG } from "../config/renderConfig";
import type { PathSimplificationAlgorithm, PipelineOutput } from "./types";

export interface SvgExportOptions {
  width: number;
  height: number;
  showOriginal: boolean;
  originalImageDataUrl?: string;
  showCells: boolean;
  showVoronoi: boolean;
  showSeeds: boolean;
  blackAndWhiteCells: boolean;
  skipWhiteCells: boolean;
  combineSameColorCells: boolean;
  pathSimplificationAlgorithm: PathSimplificationAlgorithm;
  pathSimplificationStrength: number;
  pathSimplificationSizeCompensation: boolean;
  pathSimplificationMinPathSize01: number;
}

function colorToRgb(color: PipelineOutput["cellColors"][number]): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function colorToOpacity(color: PipelineOutput["cellColors"][number]): string {
  return (color.a / 255).toString();
}

function scaledPolygonPoints(
  points: PipelineOutput["cellPolygons"][number],
  scaleX: number,
  scaleY: number,
): string {
  return points.map((p) => `${p.x * scaleX},${p.y * scaleY}`).join(" ");
}

function ringsToPathData(
  rings: PipelineOutput["cellPolygons"],
  scaleX: number,
  scaleY: number,
): string {
  return rings
    .map((ring) => {
      if (ring.length === 0) return "";
      const head = ring[0];
      const tail = ring.slice(1);
      const segments = tail
        .map((point) => `L ${point.x * scaleX} ${point.y * scaleY}`)
        .join(" ");
      return `M ${head.x * scaleX} ${head.y * scaleY} ${segments} Z`;
    })
    .filter(Boolean)
    .join(" ");
}

export function buildVoronoiSvg(
  pipelineOutput: PipelineOutput,
  options: SvgExportOptions,
): string {
  const scaleX = options.width / pipelineOutput.imageWidth;
  const scaleY = options.height / pipelineOutput.imageHeight;
  const styleScale = Math.min(scaleX, scaleY);

  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${options.width} ${options.height}" width="${options.width}" height="${options.height}">`,
  );

  parts.push('<g id="layer-original">');
  if (options.showOriginal && options.originalImageDataUrl) {
    parts.push(
      `<image xlink:href="${options.originalImageDataUrl}" x="0" y="0" width="${options.width}" height="${options.height}" preserveAspectRatio="none" />`,
    );
  }
  parts.push("</g>");

  const cellRender = computeCellRenderPipeline(pipelineOutput, {
    blackAndWhiteCells: options.blackAndWhiteCells,
    skipWhiteCells: options.skipWhiteCells,
    combineSameColorCells: options.combineSameColorCells,
    pathSimplificationAlgorithm: options.pathSimplificationAlgorithm,
    pathSimplificationStrength: options.pathSimplificationStrength,
    pathSimplificationSizeCompensation:
      options.pathSimplificationSizeCompensation,
    pathSimplificationMinPathSize01: options.pathSimplificationMinPathSize01,
  });

  parts.push('<g id="layer-cells">');
  if (options.showCells) {
    if (options.combineSameColorCells) {
      for (const group of cellRender.mergedOptimized ?? []) {
        const d = ringsToPathData(group.rings, scaleX, scaleY);
        if (!d) continue;
        parts.push(
          `<path d="${d}" fill="${colorToRgb(group.color)}" fill-opacity="${colorToOpacity(group.color)}" fill-rule="evenodd" />`,
        );
      }
    } else {
      for (let i = 0; i < cellRender.polygons.length; i++) {
        const polygon = cellRender.polygons[i];
        if (polygon.length === 0) continue;
        parts.push(
          `<polygon points="${scaledPolygonPoints(polygon, scaleX, scaleY)}" fill="${colorToRgb(cellRender.colors[i])}" fill-opacity="${colorToOpacity(cellRender.colors[i])}" />`,
        );
      }
    }
  }
  parts.push("</g>");

  parts.push('<g id="layer-edges">');
  if (options.showVoronoi) {
    const lineWidth =
      fractionToPx(
        RENDER_CONFIG.voronoiLineWidthFraction,
        pipelineOutput.imageWidth,
        pipelineOutput.imageHeight,
      ) * styleScale;

    for (const polygon of pipelineOutput.cellPolygons) {
      if (polygon.length === 0) continue;
      parts.push(
        `<polygon points="${scaledPolygonPoints(polygon, scaleX, scaleY)}" fill="none" stroke="${RENDER_CONFIG.voronoiLineColor}" stroke-width="${lineWidth}" />`,
      );
    }
  }
  parts.push("</g>");

  parts.push('<g id="layer-seeds">');
  if (options.showSeeds) {
    const radius =
      fractionToPx(
        RENDER_CONFIG.seedPointRadiusFraction,
        pipelineOutput.imageWidth,
        pipelineOutput.imageHeight,
      ) * styleScale;

    for (const point of pipelineOutput.seedsPx) {
      parts.push(
        `<circle cx="${point.x * scaleX}" cy="${point.y * scaleY}" r="${radius}" fill="${RENDER_CONFIG.seedPointColor}" />`,
      );
    }
  }
  parts.push("</g>");

  parts.push("</svg>");
  return parts.join("\n");
}
