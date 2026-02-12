import { useEffect, useRef, useCallback } from 'react';
import { Canvas2DRenderer } from '../../adapters/Renderer';
import { fractionToPx, RENDER_CONFIG } from '../../config/renderConfig';
import { shouldRenderCell, toRenderedCellColor } from '../../core/cellRender';
import type { PipelineOutput } from '../../core/types';
import './canvas-stage.css';

interface CanvasStageProps {
  image: HTMLImageElement | null;
  pipelineOutput: PipelineOutput | null;
  showOriginal: boolean;
  showCells: boolean;
  showVoronoi: boolean;
  showSeeds: boolean;
  blackAndWhiteCells: boolean;
  skipWhiteCells: boolean;
  combineSameColorCells?: boolean;
}

export function CanvasStage({
  image,
  pipelineOutput,
  showOriginal,
  showCells,
  showVoronoi,
  showSeeds,
  blackAndWhiteCells,
  skipWhiteCells,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Canvas2DRenderer | null>(null);
  
  // Initialize renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new Canvas2DRenderer(canvasRef.current);
    }
  }, []);
  
  // Render function
  const render = useCallback(() => {
    if (!canvasRef.current || !rendererRef.current || !image || !pipelineOutput) {
      return;
    }
    
    const container = containerRef.current;
    if (!container) return;
    
    // Calculate display size maintaining aspect ratio
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const containerAspect = containerWidth / containerHeight;
    
    let displayWidth: number;
    let displayHeight: number;
    
    if (imageAspect > containerAspect) {
      // Image is wider
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspect;
    } else {
      // Image is taller
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspect;
    }
    
    // Set canvas size
    rendererRef.current.setViewportSize(displayWidth, displayHeight);
    
    // Calculate scale factor
    const scale = displayWidth / image.naturalWidth;
    
    // Clear canvas
    rendererRef.current.clear();
    
    // Layer 1: Original image (optional)
    if (showOriginal) {
      rendererRef.current.drawOriginalImage(image, displayWidth, displayHeight);
    }

    // Layer 2: Filled Voronoi cells (optional)
    const scaledPolygons = pipelineOutput.cellPolygons.map(polygon =>
      polygon.map(p => ({ x: p.x * scale, y: p.y * scale }))
    );
    if (showCells) {
      const renderPolygons: PipelineOutput['cellPolygons'] = [];
      const renderColors: PipelineOutput['cellColors'] = [];

      for (let i = 0; i < scaledPolygons.length; i++) {
        const renderedColor = toRenderedCellColor(
          pipelineOutput.cellColors[i],
          blackAndWhiteCells
        );
        if (!shouldRenderCell(renderedColor, { blackAndWhiteCells, skipWhiteCells })) {
          continue;
        }
        renderPolygons.push(scaledPolygons[i]);
        renderColors.push(renderedColor);
      }

      rendererRef.current.drawCellFills(renderPolygons, renderColors);
    }
    
    // Layer 3: Voronoi edges (optional)
    if (showVoronoi) {
      const lineWidth = fractionToPx(
        RENDER_CONFIG.voronoiLineWidthFraction,
        image.naturalWidth,
        image.naturalHeight
      ) * scale;
      
      rendererRef.current.drawVoronoiEdges(scaledPolygons, {
        lineColor: RENDER_CONFIG.voronoiLineColor,
        lineWidth,
      });
    }
    
    // Layer 4: Seed points (optional)
    if (showSeeds) {
      const scaledSeeds = pipelineOutput.seedsPx.map(p => ({
        x: p.x * scale,
        y: p.y * scale,
      }));
      
      const radius = fractionToPx(
        RENDER_CONFIG.seedPointRadiusFraction,
        image.naturalWidth,
        image.naturalHeight
      ) * scale;
      
      rendererRef.current.drawSeedPoints(scaledSeeds, {
        pointColor: RENDER_CONFIG.seedPointColor,
        pointRadius: radius,
      });
    }


  }, [
    image,
    pipelineOutput,
    showOriginal,
    showCells,
    showVoronoi,
    showSeeds,
    blackAndWhiteCells,
    skipWhiteCells,
  ]);
  
  // Render when dependencies change
  useEffect(() => {
    requestAnimationFrame(render);
  }, [render]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(render);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);
  
  return (
    <div ref={containerRef} className="canvas-stage">
      <canvas ref={canvasRef} className="canvas-stage__canvas" />
    </div>
  );
}
