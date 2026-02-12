import { fractionToPx, RENDER_CONFIG } from '../config/renderConfig';
import { shouldRenderCell, toRenderedCellColor } from './cellRender';
import type { PipelineOutput } from './types';

export interface SvgExportOptions {
  width: number;
  height: number;
  showCells: boolean;
  showVoronoi: boolean;
  showSeeds: boolean;
  blackAndWhiteCells: boolean;
  skipWhiteCells: boolean;
}

function colorToRgb(color: PipelineOutput['cellColors'][number]): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function colorToOpacity(color: PipelineOutput['cellColors'][number]): string {
  return (color.a / 255).toString();
}

function scaledPolygonPoints(
  points: PipelineOutput['cellPolygons'][number],
  scaleX: number,
  scaleY: number
): string {
  return points.map((p) => `${p.x * scaleX},${p.y * scaleY}`).join(' ');
}

export function buildVoronoiSvg(
  pipelineOutput: PipelineOutput,
  options: SvgExportOptions
): string {
  const scaleX = options.width / pipelineOutput.imageWidth;
  const scaleY = options.height / pipelineOutput.imageHeight;
  const styleScale = Math.min(scaleX, scaleY);

  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${options.width} ${options.height}" width="${options.width}" height="${options.height}">`
  );

  parts.push('<g id="layer-cells">');
  if (options.showCells) {
    for (let i = 0; i < pipelineOutput.cellPolygons.length; i++) {
      const polygon = pipelineOutput.cellPolygons[i];
      if (polygon.length === 0) continue;
      const renderedColor = toRenderedCellColor(
        pipelineOutput.cellColors[i],
        options.blackAndWhiteCells
      );
      if (!shouldRenderCell(renderedColor, options)) continue;
      parts.push(
        `<polygon points="${scaledPolygonPoints(polygon, scaleX, scaleY)}" fill="${colorToRgb(renderedColor)}" fill-opacity="${colorToOpacity(renderedColor)}" />`
      );
    }
  }
  parts.push('</g>');

  parts.push('<g id="layer-edges">');
  if (options.showVoronoi) {
    const lineWidth =
      fractionToPx(
        RENDER_CONFIG.voronoiLineWidthFraction,
        pipelineOutput.imageWidth,
        pipelineOutput.imageHeight
      ) * styleScale;

    for (const polygon of pipelineOutput.cellPolygons) {
      if (polygon.length === 0) continue;
      parts.push(
        `<polygon points="${scaledPolygonPoints(polygon, scaleX, scaleY)}" fill="none" stroke="${RENDER_CONFIG.voronoiLineColor}" stroke-width="${lineWidth}" />`
      );
    }
  }
  parts.push('</g>');

  parts.push('<g id="layer-seeds">');
  if (options.showSeeds) {
    const radius =
      fractionToPx(
        RENDER_CONFIG.seedPointRadiusFraction,
        pipelineOutput.imageWidth,
        pipelineOutput.imageHeight
      ) * styleScale;

    for (const point of pipelineOutput.seedsPx) {
      parts.push(
        `<circle cx="${point.x * scaleX}" cy="${point.y * scaleY}" r="${radius}" fill="${RENDER_CONFIG.seedPointColor}" />`
      );
    }
  }
  parts.push('</g>');

  parts.push('</svg>');
  return parts.join('\n');
}
