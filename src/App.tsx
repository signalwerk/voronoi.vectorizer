import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Dropzone } from "./components/Dropzone/Dropzone";
import { CanvasStage } from "./components/CanvasStage/CanvasStage";
import { ConfigPanel } from "./components/ConfigPanel/ConfigPanel";
import { runPipeline } from "./core/pipeline";
import { computeSimplificationPointStats } from "./core/simplificationStats";
import { buildVoronoiSvg } from "./core/svgExport";
import { CanvasPixelSource } from "./adapters/PixelSource";
import { RENDER_CONFIG } from "./config/renderConfig";
import type {
  PathSimplificationAlgorithm,
  PipelineOutput,
  SeedStrategy,
} from "./core/types";
import "./App.css";

interface ImageMeta {
  name: string;
  width: number;
  height: number;
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

function imageToDataUrl(image: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context for image embedding");
  }
  ctx.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function App() {
  // Image state
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);

  // Configuration state
  const [seedDensity, setSeedDensity] = useState(
    RENDER_CONFIG.defaultSeedDensity,
  );
  const [seedValue, setSeedValue] = useState(RENDER_CONFIG.defaultSeedValue);
  const [seedStrategy] = useState<SeedStrategy>("aspect");

  // Display toggles
  const [showOriginal, setShowOriginal] = useState(false);
  const [showCells, setShowCells] = useState(true);
  const [showVoronoi, setShowVoronoi] = useState(false);
  const [showSeeds, setShowSeeds] = useState(false);
  const [blackAndWhiteCells, setBlackAndWhiteCells] = useState(false);
  const [skipWhiteCells, setSkipWhiteCells] = useState(true);
  const [combineSameColorCells, setCombineSameColorCells] = useState(false);
  const [pathSimplificationAlgorithm, setPathSimplificationAlgorithm] =
    useState<PathSimplificationAlgorithm>("none");
  const [pathSimplificationStrength, setPathSimplificationStrength] =
    useState(0);
  const [
    pathSimplificationSizeCompensation,
    setPathSimplificationSizeCompensation,
  ] = useState(true);
  const [pathSimplificationMinPathSize01, setPathSimplificationMinPathSize01] =
    useState(0);

  // Pipeline state
  const [pipelineOutput, setPipelineOutput] = useState<PipelineOutput | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyCLIButtonLabel, setCopyCLIButtonLabel] =
    useState("Copy CLI Command");

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
            colorMode: "seedPoint",
          },
          pixelSourceRef.current!,
        );

        setPipelineOutput(output);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Pipeline error");
        console.error("Pipeline error:", err);
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
      alert("No Voronoi data to export");
      return;
    }

    const exportWidth = pipelineOutput.imageWidth;
    const exportHeight = pipelineOutput.imageHeight;
    let originalImageDataUrl: string | undefined;
    if (showOriginal && image) {
      try {
        originalImageDataUrl = imageToDataUrl(image);
      } catch (err) {
        console.error("Failed to embed original image in SVG:", err);
      }
    }
    const svgMarkup = buildVoronoiSvg(pipelineOutput, {
      width: exportWidth,
      height: exportHeight,
      showOriginal,
      originalImageDataUrl,
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
    });
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName(imageMeta?.name ?? "voronoi")}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    pipelineOutput,
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
    showOriginal,
    image,
    imageMeta,
  ]);

  const handleCopyCLICommand = useCallback(async () => {
    const command = [
      "npm run cli --",
      `--input ${shellQuote("/path/to/input-image.jpg")}`,
      `--output ${shellQuote("/path/to/output.svg")}`,
      `--seed-density ${seedDensity}`,
      `--seed-value ${shellQuote(seedValue)}`,
      `--seed-strategy ${seedStrategy}`,
      `--show-cells ${showCells}`,
      `--show-voronoi ${showVoronoi}`,
      `--show-seeds ${showSeeds}`,
      `--show-original ${showOriginal}`,
      `--black-and-white-cells ${blackAndWhiteCells}`,
      `--skip-white-cells ${skipWhiteCells}`,
      `--combine-same-color-cells ${combineSameColorCells}`,
      `--path-simplification-algorithm ${pathSimplificationAlgorithm}`,
      `--path-simplification-strength ${pathSimplificationStrength}`,
      `--path-simplification-size-compensation ${pathSimplificationSizeCompensation}`,
      `--path-simplification-min-path-size01 ${pathSimplificationMinPathSize01}`,
      "--scale 1",
    ]
      // indent from the second line onwards
      .map((line, index) => (index === 0 ? line : "    " + line))
      .join(" \\\n");

    try {
      await navigator.clipboard.writeText(command);
      setCopyCLIButtonLabel("Command Copied");
      setTimeout(() => setCopyCLIButtonLabel("Copy CLI Command"), 1500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      alert(`Copy failed. Command:\\n\\n${command}`);
    }
  }, [
    seedDensity,
    seedValue,
    seedStrategy,
    showCells,
    showVoronoi,
    showSeeds,
    showOriginal,
    blackAndWhiteCells,
    skipWhiteCells,
    combineSameColorCells,
    pathSimplificationAlgorithm,
    pathSimplificationStrength,
    pathSimplificationSizeCompensation,
    pathSimplificationMinPathSize01,
  ]);

  const simplificationStats = useMemo(() => {
    if (!pipelineOutput) return null;
    return computeSimplificationPointStats(pipelineOutput, {
      blackAndWhiteCells,
      skipWhiteCells,
      combineSameColorCells,
      pathSimplificationAlgorithm,
      pathSimplificationStrength,
      pathSimplificationSizeCompensation,
      pathSimplificationMinPathSize01,
    });
  }, [
    pipelineOutput,
    combineSameColorCells,
    pathSimplificationAlgorithm,
    pathSimplificationStrength,
    pathSimplificationSizeCompensation,
    pathSimplificationMinPathSize01,
    blackAndWhiteCells,
    skipWhiteCells,
  ]);

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
              blackAndWhiteCells={blackAndWhiteCells}
              skipWhiteCells={skipWhiteCells}
              combineSameColorCells={combineSameColorCells}
              pathSimplificationAlgorithm={pathSimplificationAlgorithm}
              pathSimplificationStrength={pathSimplificationStrength}
              pathSimplificationSizeCompensation={
                pathSimplificationSizeCompensation
              }
              pathSimplificationMinPathSize01={pathSimplificationMinPathSize01}
            />
          )}

          {isProcessing && <div className="app__processing">Processing...</div>}

          {error && <div className="app__error">Error: {error}</div>}
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
              blackAndWhiteCells={blackAndWhiteCells}
              skipWhiteCells={skipWhiteCells}
              combineSameColorCells={combineSameColorCells}
              pathSimplificationAlgorithm={pathSimplificationAlgorithm}
              pathSimplificationStrength={pathSimplificationStrength}
              pathSimplificationSizeCompensation={
                pathSimplificationSizeCompensation
              }
              pathSimplificationMinPathSize01={pathSimplificationMinPathSize01}
              onSeedDensityChange={setSeedDensity}
              onSeedValueChange={setSeedValue}
              onRandomizeSeed={handleRandomizeSeed}
              onShowOriginalChange={setShowOriginal}
              onShowCellsChange={setShowCells}
              onShowVoronoiChange={setShowVoronoi}
              onShowSeedsChange={setShowSeeds}
              onBlackAndWhiteCellsChange={setBlackAndWhiteCells}
              onSkipWhiteCellsChange={setSkipWhiteCells}
              onCombineSameColorCellsChange={setCombineSameColorCells}
              onPathSimplificationAlgorithmChange={
                setPathSimplificationAlgorithm
              }
              onPathSimplificationStrengthChange={setPathSimplificationStrength}
              onPathSimplificationSizeCompensationChange={
                setPathSimplificationSizeCompensation
              }
              onPathSimplificationMinPathSize01Change={
                setPathSimplificationMinPathSize01
              }
              simplificationOriginalPoints={
                simplificationStats?.originalPoints ?? null
              }
              simplificationOptimizedPoints={
                simplificationStats?.optimizedPoints ?? null
              }
              onExportSVG={handleExportSVG}
              onCopyCLICommand={handleCopyCLICommand}
              copyCLIButtonLabel={copyCLIButtonLabel}
            />
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
