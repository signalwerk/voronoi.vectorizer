import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas2DRenderer } from '../../adapters/Renderer';
import { fractionToPx, RENDER_CONFIG } from '../../config/renderConfig';
import { computeCellRenderPipeline } from '../../core/cellRenderPipeline';
import type { PathSimplificationAlgorithm, PipelineOutput } from '../../core/types';
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
  combineSameColorCells: boolean;
  pathSimplificationAlgorithm: PathSimplificationAlgorithm;
  pathSimplificationStrength: number;
  pathSimplificationSizeCompensation: boolean;
  pathSimplificationMinPathSize01: number;
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
  combineSameColorCells,
  pathSimplificationAlgorithm,
  pathSimplificationStrength,
  pathSimplificationSizeCompensation,
  pathSimplificationMinPathSize01,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Canvas2DRenderer | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ x: number; y: number } | null>(null);
  
  // Initialize renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new Canvas2DRenderer(canvasRef.current);
    }
  }, []);

  // Reset camera when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [image]);
  
  // Render function
  const render = useCallback(() => {
    if (!canvasRef.current || !rendererRef.current || !image || !pipelineOutput) {
      return;
    }
    
    const container = containerRef.current;
    if (!container) return;
    
    // Calculate base fit scale maintaining aspect ratio
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const containerAspect = containerWidth / containerHeight;

    const baseScale =
      imageAspect > containerAspect
        ? containerWidth / image.naturalWidth
        : containerHeight / image.naturalHeight;
    const scale = baseScale * zoom;

    // Set canvas size to full container (camera viewport)
    rendererRef.current.setViewportSize(containerWidth, containerHeight);

    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const drawX = containerWidth / 2 + pan.x - drawWidth / 2;
    const drawY = containerHeight / 2 + pan.y - drawHeight / 2;
    
    // Clear canvas
    rendererRef.current.clear();
    
    // Layer 1: Original image (optional)
    if (showOriginal) {
      rendererRef.current.drawOriginalImage(image, drawWidth, drawHeight, drawX, drawY);
    }

    // Layer 2: Filled Voronoi cells (optional)
    const scaledPolygons = pipelineOutput.cellPolygons.map((polygon) =>
      polygon.map((p) => ({ x: drawX + p.x * scale, y: drawY + p.y * scale }))
    );
    if (showCells) {
      const cellRender = computeCellRenderPipeline(pipelineOutput, {
        blackAndWhiteCells,
        skipWhiteCells,
        combineSameColorCells,
        pathSimplificationAlgorithm,
        pathSimplificationStrength,
        pathSimplificationSizeCompensation,
        pathSimplificationMinPathSize01,
      });
      if (combineSameColorCells) {
        const scaledMergedGroups = (cellRender.mergedOptimized ?? []).map((group) => ({
          color: group.color,
          rings: group.rings.map((ring) =>
            ring.map((point) => ({ x: drawX + point.x * scale, y: drawY + point.y * scale }))
          ),
        }));
        rendererRef.current.drawMergedCellFills(scaledMergedGroups);
      } else {
        const scaledRenderPolygons = cellRender.polygons.map((polygon) =>
          polygon.map((point) => ({ x: drawX + point.x * scale, y: drawY + point.y * scale }))
        );
        rendererRef.current.drawCellFills(scaledRenderPolygons, cellRender.colors);
      }
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
        x: drawX + p.x * scale,
        y: drawY + p.y * scale,
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
    combineSameColorCells,
    pathSimplificationAlgorithm,
    pathSimplificationStrength,
    pathSimplificationSizeCompensation,
    pathSimplificationMinPathSize01,
    zoom,
    pan.x,
    pan.y,
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

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStateRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) return;
    const dx = event.clientX - dragStateRef.current.x;
    const dy = event.clientY - dragStateRef.current.y;
    dragStateRef.current = { x: event.clientX, y: event.clientY };
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    dragStateRef.current = null;
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!image || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const imageAspect = image.naturalWidth / image.naturalHeight;
      const containerAspect = containerWidth / containerHeight;
      const baseScale =
        imageAspect > containerAspect
          ? containerWidth / image.naturalWidth
          : containerHeight / image.naturalHeight;

      const currentZoom = zoom;
      const nextZoom = Math.max(0.2, Math.min(30, currentZoom * (event.deltaY < 0 ? 1.1 : 0.9)));
      if (nextZoom === currentZoom) return;

      const s1 = baseScale * currentZoom;
      const s2 = baseScale * nextZoom;

      const tx1 = containerWidth / 2 + pan.x - (image.naturalWidth * s1) / 2;
      const ty1 = containerHeight / 2 + pan.y - (image.naturalHeight * s1) / 2;
      const wx = (cursorX - tx1) / s1;
      const wy = (cursorY - ty1) / s1;

      const tx2 = cursorX - wx * s2;
      const ty2 = cursorY - wy * s2;

      const panX2 = tx2 - containerWidth / 2 + (image.naturalWidth * s2) / 2;
      const panY2 = ty2 - containerHeight / 2 + (image.naturalHeight * s2) / 2;

      setZoom(nextZoom);
      setPan({ x: panX2, y: panY2 });
    },
    [image, pan.x, pan.y, zoom]
  );

  const handleDoubleClick = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);
  
  return (
    <div
      ref={containerRef}
      className={`canvas-stage ${isDragging ? 'canvas-stage--dragging' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    >
      <canvas ref={canvasRef} className="canvas-stage__canvas" />
    </div>
  );
}
