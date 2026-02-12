import { useState, useEffect, useCallback, useRef } from 'react';
import { Dropzone } from './components/Dropzone/Dropzone';
import { CanvasStage } from './components/CanvasStage/CanvasStage';
import { ConfigPanel } from './components/ConfigPanel/ConfigPanel';
import { runPipeline } from './core/pipeline';
import { CanvasPixelSource } from './adapters/PixelSource';
import { fractionToPx, RENDER_CONFIG } from './config/renderConfig';
import type { PipelineOutput, SeedStrategy } from './core/types';
import './App.css';

interface ImageMeta {
  name: string;
  width: number;
  height: number;
}

function colorToRgb(color: PipelineOutput['cellColors'][number]): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function colorToOpacity(color: PipelineOutput['cellColors'][number]): string {
  return (color.a / 255).toString();
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

function scaledPolygonPoints(
  points: PipelineOutput['cellPolygons'][number],
  scale: number
): string {
  return points.map((p) => `${p.x * scale},${p.y * scale}`).join(' ');
}

function App() {
  // Image state
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  
  // Configuration state
  const [seedDensity, setSeedDensity] = useState(RENDER_CONFIG.defaultSeedDensity);
  const [seedValue, setSeedValue] = useState(RENDER_CONFIG.defaultSeedValue);
  const [seedStrategy] = useState<SeedStrategy>('aspect');
  
  // Display toggles
  const [showOriginal, setShowOriginal] = useState(false);
  const [showCells, setShowCells] = useState(true);
  const [showVoronoi, setShowVoronoi] = useState(true);
  const [showSeeds, setShowSeeds] = useState(false);
  
  // Pipeline state
  const [pipelineOutput, setPipelineOutput] = useState<PipelineOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const pixelSourceRef = useRef<CanvasPixelSource | null>(null);
  
  // Handle image load
  const handleImageLoad = useCallback((file: File, img: HTMLImageElement) => {
    setImage(img);
    setImageMeta({
      name: file.name,
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    
    // Clean up old pixel source
    if (pixelSourceRef.current) {
      pixelSourceRef.current.dispose();
    }
    
    // Create new pixel source
    pixelSourceRef.current = new CanvasPixelSource(img);
  }, []);
  
  // Run pipeline
  useEffect(() => {
    if (!image || !imageMeta || !pixelSourceRef.current) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    // Run pipeline in next frame to keep UI responsive
    requestAnimationFrame(() => {
      try {
        const output = runPipeline(
          {
            imageWidth: imageMeta.width,
            imageHeight: imageMeta.height,
            seedDensity,
            seedValue,
            seedStrategy,
            colorMode: 'seedPoint',
          },
          pixelSourceRef.current!
        );
        
        setPipelineOutput(output);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Pipeline error');
        console.error('Pipeline error:', err);
      } finally {
        setIsProcessing(false);
      }
    });
  }, [image, imageMeta, seedDensity, seedValue, seedStrategy]);
  
  // Randomize seed
  const handleRandomizeSeed = useCallback(() => {
    setSeedValue(Math.random().toString(36).substring(2, 15));
  }, []);
  
  // Export SVG
  const handleExportSVG = useCallback(() => {
    if (!pipelineOutput) {
      alert('No Voronoi data to export');
      return;
    }

    const canvasElement = canvasStageRef.current?.querySelector('canvas');
    const exportWidth = canvasElement?.clientWidth || pipelineOutput.imageWidth;
    const exportHeight = canvasElement?.clientHeight || pipelineOutput.imageHeight;
    const scale = exportWidth / pipelineOutput.imageWidth;

    const parts: string[] = [];
    parts.push('<?xml version="1.0" encoding="UTF-8"?>');
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${exportWidth} ${exportHeight}" width="${exportWidth}" height="${exportHeight}">`
    );

    parts.push('<g id="layer-cells">');
    if (showCells) {
      for (let i = 0; i < pipelineOutput.cellPolygons.length; i++) {
        const polygon = pipelineOutput.cellPolygons[i];
        if (polygon.length === 0) continue;
        parts.push(
          `<polygon points="${scaledPolygonPoints(polygon, scale)}" fill="${colorToRgb(pipelineOutput.cellColors[i])}" fill-opacity="${colorToOpacity(pipelineOutput.cellColors[i])}" />`
        );
      }
    }
    parts.push('</g>');

    parts.push('<g id="layer-edges">');
    if (showVoronoi) {
      const lineWidth = fractionToPx(
        RENDER_CONFIG.voronoiLineWidthFraction,
        pipelineOutput.imageWidth,
        pipelineOutput.imageHeight
      ) * scale;
      for (const polygon of pipelineOutput.cellPolygons) {
        if (polygon.length === 0) continue;
        parts.push(
          `<polygon points="${scaledPolygonPoints(polygon, scale)}" fill="none" stroke="${RENDER_CONFIG.voronoiLineColor}" stroke-width="${lineWidth}" />`
        );
      }
    }
    parts.push('</g>');

    parts.push('<g id="layer-seeds">');
    if (showSeeds) {
      const radius = fractionToPx(
        RENDER_CONFIG.seedPointRadiusFraction,
        pipelineOutput.imageWidth,
        pipelineOutput.imageHeight
      ) * scale;
      for (const point of pipelineOutput.seedsPx) {
        parts.push(
          `<circle cx="${point.x * scale}" cy="${point.y * scale}" r="${radius}" fill="${RENDER_CONFIG.seedPointColor}" />`
        );
      }
    }
    parts.push('</g>');

    parts.push('</svg>');
    const svgMarkup = parts.join('\n');
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName(imageMeta?.name ?? 'voronoi')}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [pipelineOutput, showCells, showVoronoi, showSeeds, imageMeta]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pixelSourceRef.current) {
        pixelSourceRef.current.dispose();
      }
    };
  }, []);
  
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Voronoi Image Vectorizer</h1>
        <p className="app__subtitle">
          Transform images into artistic Voronoi mosaics
        </p>
      </header>
      
      <main className="app__main">
        <div className="app__canvas-container" ref={canvasStageRef}>
          {!image ? (
            <Dropzone onImageLoad={handleImageLoad} />
          ) : (
            <CanvasStage
              image={image}
              pipelineOutput={pipelineOutput}
              showOriginal={showOriginal}
              showCells={showCells}
              showVoronoi={showVoronoi}
              showSeeds={showSeeds}
            />
          )}
          
          {isProcessing && (
            <div className="app__processing">
              Processing...
            </div>
          )}
          
          {error && (
            <div className="app__error">
              Error: {error}
            </div>
          )}
        </div>
        
        <aside className="app__sidebar">
          {image && (
            <ConfigPanel
              imageMeta={imageMeta}
              seedDensity={seedDensity}
              seedValue={seedValue}
              showOriginal={showOriginal}
              showCells={showCells}
              showVoronoi={showVoronoi}
              showSeeds={showSeeds}
              onSeedDensityChange={setSeedDensity}
              onSeedValueChange={setSeedValue}
              onRandomizeSeed={handleRandomizeSeed}
              onShowOriginalChange={setShowOriginal}
              onShowCellsChange={setShowCells}
              onShowVoronoiChange={setShowVoronoi}
              onShowSeedsChange={setShowSeeds}
              onExportSVG={handleExportSVG}
            />
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
