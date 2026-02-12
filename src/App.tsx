import { useState, useEffect, useCallback, useRef } from 'react';
import { Dropzone } from './components/Dropzone/Dropzone';
import { CanvasStage } from './components/CanvasStage/CanvasStage';
import { ConfigPanel } from './components/ConfigPanel/ConfigPanel';
import { runPipeline } from './core/pipeline';
import { CanvasPixelSource } from './adapters/PixelSource';
import { RENDER_CONFIG } from './config/renderConfig';
import type { PipelineOutput, SeedStrategy } from './core/types';
import './App.css';

interface ImageMeta {
  name: string;
  width: number;
  height: number;
}

function App() {
  // Image state
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  
  // Configuration state
  const [seedDensity, setSeedDensity] = useState(RENDER_CONFIG.defaultSeedDensity);
  const [seedValue, setSeedValue] = useState(RENDER_CONFIG.defaultSeedValue);
  const [seedStrategy] = useState<SeedStrategy>('aspect');
  const [colorMode, setColorMode] = useState<'cellAverage' | 'seedPoint'>('seedPoint');
  const [renderScale, setRenderScale] = useState(RENDER_CONFIG.defaultRenderScale);
  
  // Display toggles
  const [showOriginal, setShowOriginal] = useState(false);
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
            colorMode,
            renderScale: colorMode === 'cellAverage' ? renderScale : 1.0,
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
  }, [image, imageMeta, seedDensity, seedValue, seedStrategy, colorMode, renderScale]);
  
  // Randomize seed
  const handleRandomizeSeed = useCallback(() => {
    setSeedValue(Math.random().toString(36).substring(2, 15));
  }, []);
  
  // Export PNG
  const handleExportPNG = useCallback(() => {
    const canvasElement = canvasStageRef.current?.querySelector('canvas');
    if (!canvasElement) {
      alert('No canvas to export');
      return;
    }
    
    canvasElement.toBlob((blob) => {
      if (!blob) {
        alert('Failed to create image');
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voronoi-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, []);
  
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
              showVoronoi={showVoronoi}
              showSeeds={showSeeds}
              colorMode={colorMode}
              renderScale={renderScale}
              onSeedDensityChange={setSeedDensity}
              onSeedValueChange={setSeedValue}
              onRandomizeSeed={handleRandomizeSeed}
              onShowOriginalChange={setShowOriginal}
              onShowVoronoiChange={setShowVoronoi}
              onShowSeedsChange={setShowSeeds}
              onColorModeChange={setColorMode}
              onRenderScaleChange={setRenderScale}
              onExportPNG={handleExportPNG}
            />
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
