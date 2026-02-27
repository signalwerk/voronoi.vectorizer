import { useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import * as Label from "@radix-ui/react-label";
import * as Slider from "@radix-ui/react-slider";
import type { PathSimplificationAlgorithm } from "../../core/types";
import "./config-panel.css";

interface ImageMeta {
  name: string;
  width: number;
  height: number;
}

interface ConfigPanelProps {
  imageMeta: ImageMeta | null;
  seedDensity: number;
  seedValue: string;
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
  seedPointRadiusFraction: number;
  onSeedDensityChange: (value: number) => void;
  onSeedValueChange: (value: string) => void;
  onRandomizeSeed: () => void;
  onShowOriginalChange: (value: boolean) => void;
  onShowCellsChange: (value: boolean) => void;
  onShowVoronoiChange: (value: boolean) => void;
  onShowSeedsChange: (value: boolean) => void;
  onBlackAndWhiteCellsChange: (value: boolean) => void;
  onSkipWhiteCellsChange: (value: boolean) => void;
  onCombineSameColorCellsChange: (value: boolean) => void;
  onPathSimplificationAlgorithmChange: (
    value: PathSimplificationAlgorithm,
  ) => void;
  onPathSimplificationStrengthChange: (value: number) => void;
  onPathSimplificationSizeCompensationChange: (value: boolean) => void;
  onPathSimplificationMinPathSize01Change: (value: number) => void;
  onSeedPointRadiusFractionChange: (value: number) => void;
  simplificationOriginalPoints?: number | null;
  simplificationOptimizedPoints?: number | null;
  onExportSVG: () => void;
  onCopyCLICommand: () => void;
  copyCLIButtonLabel?: string;
}

export function ConfigPanel({
  imageMeta,
  seedDensity,
  seedValue,
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
  seedPointRadiusFraction,
  onSeedDensityChange,
  onSeedValueChange,
  onRandomizeSeed,
  onShowOriginalChange,
  onShowCellsChange,
  onShowVoronoiChange,
  onShowSeedsChange,
  onBlackAndWhiteCellsChange,
  onSkipWhiteCellsChange,
  onCombineSameColorCellsChange,
  onPathSimplificationAlgorithmChange,
  onPathSimplificationStrengthChange,
  onPathSimplificationSizeCompensationChange,
  onPathSimplificationMinPathSize01Change,
  onSeedPointRadiusFractionChange,
  simplificationOriginalPoints = null,
  simplificationOptimizedPoints = null,
  onExportSVG,
  onCopyCLICommand,
  copyCLIButtonLabel = "Copy CLI Command",
}: ConfigPanelProps) {
  type EditableField =
    | "density"
    | "simplify-strength"
    | "min-path-size"
    | "seed-radius";
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const startEditing = (field: EditableField, value: number) => {
    setEditingField(field);
    setEditingValue(String(value));
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingValue("");
  };

  const commitEditing = () => {
    const parsed = Number(editingValue);
    if (!Number.isFinite(parsed) || !editingField) {
      cancelEditing();
      return;
    }

    if (editingField === "density") {
      const clamped = Math.max(
        10,
        Math.min(100_000, Math.round(parsed / 10) * 10),
      );
      onSeedDensityChange(clamped);
    } else if (editingField === "simplify-strength") {
      const clamped = Math.max(0, Math.min(1, parsed));
      onPathSimplificationStrengthChange(clamped);
    } else if (editingField === "min-path-size") {
      const clamped = Math.max(0, Math.min(1, parsed));
      onPathSimplificationMinPathSize01Change(clamped);
    } else if (editingField === "seed-radius") {
      const clamped = Math.max(0, Math.min(1, parsed));
      onSeedPointRadiusFractionChange(clamped);
    }

    cancelEditing();
  };

  return (
    <div className="config-panel">
      {/* Image Info */}
      {imageMeta && (
        <div className="config-panel__section">
          <h3 className="config-panel__title">Image Info</h3>
          <div className="config-panel__info">
            <div className="config-panel__info-row">
              <span className="config-panel__info-label">File:</span>
              <span className="config-panel__info-value">{imageMeta.name}</span>
            </div>
            <div className="config-panel__info-row">
              <span className="config-panel__info-label">Size:</span>
              <span className="config-panel__info-value">
                {imageMeta.width} × {imageMeta.height}
              </span>
            </div>
            <div className="config-panel__info-row">
              <span className="config-panel__info-label">Aspect:</span>
              <span className="config-panel__info-value">
                {(imageMeta.width / imageMeta.height).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Seed Configuration */}
      <div className="config-panel__section">
        <h3 className="config-panel__title">Seed Configuration</h3>

        <div className="config-panel__control">
          {editingField === "density" ? (
            <input
              className="config-panel__inline-input"
              autoFocus
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={commitEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEditing();
                if (e.key === "Escape") cancelEditing();
              }}
            />
          ) : (
            <Label.Root
              className="config-panel__label"
              htmlFor="density"
              onDoubleClick={() => startEditing("density", seedDensity)}
            >
              Seed Density: {seedDensity}
            </Label.Root>
          )}
          <Slider.Root
            className="slider"
            id="density"
            min={10}
            max={100_000}
            step={10}
            value={[seedDensity]}
            onValueChange={([value]) => onSeedDensityChange(value)}
          >
            <Slider.Track className="slider__track">
              <Slider.Range className="slider__range" />
            </Slider.Track>
            <Slider.Thumb className="slider__thumb" />
          </Slider.Root>
        </div>

        <div className="config-panel__control">
          <Label.Root className="config-panel__label" htmlFor="seed">
            Seed Value
          </Label.Root>
          <div className="config-panel__input-group">
            <input
              id="seed"
              type="text"
              className="config-panel__input"
              value={seedValue}
              onChange={(e) => onSeedValueChange(e.target.value)}
            />
            <button className="config-panel__button" onClick={onRandomizeSeed}>
              Randomize
            </button>
          </div>
        </div>

        <div className="config-panel__control">
          {editingField === "seed-radius" ? (
            <input
              className="config-panel__inline-input"
              autoFocus
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={commitEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEditing();
                if (e.key === "Escape") cancelEditing();
              }}
            />
          ) : (
            <Label.Root
              className="config-panel__label"
              htmlFor="seed-radius"
              onDoubleClick={() =>
                startEditing("seed-radius", seedPointRadiusFraction)
              }
            >
              Seed Point Radius: {seedPointRadiusFraction.toFixed(4)}
            </Label.Root>
          )}
          <Slider.Root
            className="slider"
            id="seed-radius"
            min={0}
            max={0.01}
            step={0.0001}
            value={[seedPointRadiusFraction]}
            onValueChange={([value]) => onSeedPointRadiusFractionChange(value)}
          >
            <Slider.Track className="slider__track">
              <Slider.Range className="slider__range" />
            </Slider.Track>
            <Slider.Thumb className="slider__thumb" />
          </Slider.Root>
        </div>
      </div>

      {/* Display Toggles */}
      <div className="config-panel__section">
        <h3 className="config-panel__title">Display Options</h3>

        <div className="config-panel__toggle">
          <Label.Root className="config-panel__toggle-label" htmlFor="original">
            Show Original Image
          </Label.Root>
          <Switch.Root
            className="switch"
            id="original"
            checked={showOriginal}
            onCheckedChange={onShowOriginalChange}
          >
            <Switch.Thumb className="switch__thumb" />
          </Switch.Root>
        </div>

        <div className="config-panel__toggle">
          <Label.Root className="config-panel__toggle-label" htmlFor="cells">
            Show Filled Cells
          </Label.Root>
          <Switch.Root
            className="switch"
            id="cells"
            checked={showCells}
            onCheckedChange={onShowCellsChange}
          >
            <Switch.Thumb className="switch__thumb" />
          </Switch.Root>
        </div>

        <div className="config-panel__toggle">
          <Label.Root className="config-panel__toggle-label" htmlFor="edges">
            Show Voronoi Edges
          </Label.Root>
          <Switch.Root
            className="switch"
            id="edges"
            checked={showVoronoi}
            onCheckedChange={onShowVoronoiChange}
          >
            <Switch.Thumb className="switch__thumb" />
          </Switch.Root>
        </div>

        <div className="config-panel__toggle">
          <Label.Root className="config-panel__toggle-label" htmlFor="seeds">
            Show Seed Points
          </Label.Root>
          <Switch.Root
            className="switch"
            id="seeds"
            checked={showSeeds}
            onCheckedChange={onShowSeedsChange}
          >
            <Switch.Thumb className="switch__thumb" />
          </Switch.Root>
        </div>

        <div className="config-panel__toggle">
          <Label.Root className="config-panel__toggle-label" htmlFor="bw-cells">
            Cells Black & White
          </Label.Root>
          <Switch.Root
            className="switch"
            id="bw-cells"
            checked={blackAndWhiteCells}
            onCheckedChange={onBlackAndWhiteCellsChange}
          >
            <Switch.Thumb className="switch__thumb" />
          </Switch.Root>
        </div>

        <div className="config-panel__toggle">
          <Label.Root
            className="config-panel__toggle-label"
            htmlFor="skip-white"
          >
            Skip White Cells
          </Label.Root>
          <Switch.Root
            className="switch"
            id="skip-white"
            checked={skipWhiteCells}
            onCheckedChange={onSkipWhiteCellsChange}
          >
            <Switch.Thumb className="switch__thumb" />
          </Switch.Root>
        </div>

        <div className="config-panel__toggle">
          <Label.Root
            className="config-panel__toggle-label"
            htmlFor="combine-color-cells"
          >
            Combine Same Color Cells
          </Label.Root>
          <Switch.Root
            className="switch"
            id="combine-color-cells"
            checked={combineSameColorCells}
            onCheckedChange={onCombineSameColorCellsChange}
          >
            <Switch.Thumb className="switch__thumb" />
          </Switch.Root>
        </div>

        {combineSameColorCells && (
          <>
            <div className="config-panel__control">
              <Label.Root
                className="config-panel__label"
                htmlFor="simplify-algorithm"
              >
                Path Simplification Algorithm
              </Label.Root>
              <select
                id="simplify-algorithm"
                className="config-panel__select"
                value={pathSimplificationAlgorithm}
                onChange={(e) =>
                  onPathSimplificationAlgorithmChange(
                    e.target.value as PathSimplificationAlgorithm,
                  )
                }
              >
                <option value="none">No Simplification</option>
                <option value="rdp">Ramer-Douglas-Peucker (RDP)</option>
                <option value="vw">Visvalingam-Whyatt (VW)</option>
                <option value="rw">Reumann-Witkam (RW)</option>
              </select>
            </div>

            <div className="config-panel__control">
              {editingField === "simplify-strength" ? (
                <input
                  className="config-panel__inline-input"
                  autoFocus
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={commitEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEditing();
                    if (e.key === "Escape") cancelEditing();
                  }}
                />
              ) : (
                <Label.Root
                  className="config-panel__label"
                  htmlFor="simplify-strength"
                  onDoubleClick={() =>
                    startEditing(
                      "simplify-strength",
                      pathSimplificationStrength,
                    )
                  }
                >
                  Simplification Strength:{" "}
                  {pathSimplificationStrength.toFixed(2)}
                </Label.Root>
              )}
              <Slider.Root
                className="slider"
                id="simplify-strength"
                min={0}
                max={1}
                step={0.01}
                value={[pathSimplificationStrength]}
                onValueChange={([value]) =>
                  onPathSimplificationStrengthChange(value)
                }
              >
                <Slider.Track className="slider__track">
                  <Slider.Range className="slider__range" />
                </Slider.Track>
                <Slider.Thumb className="slider__thumb" />
              </Slider.Root>
            </div>

            <div className="config-panel__toggle">
              <Label.Root
                className="config-panel__toggle-label"
                htmlFor="size-comp"
              >
                Simplification Size Compensation
              </Label.Root>
              <Switch.Root
                className="switch"
                id="size-comp"
                checked={pathSimplificationSizeCompensation}
                onCheckedChange={onPathSimplificationSizeCompensationChange}
              >
                <Switch.Thumb className="switch__thumb" />
              </Switch.Root>
            </div>

            <div className="config-panel__control">
              {editingField === "min-path-size" ? (
                <input
                  className="config-panel__inline-input"
                  autoFocus
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={commitEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEditing();
                    if (e.key === "Escape") cancelEditing();
                  }}
                />
              ) : (
                <Label.Root
                  className="config-panel__label"
                  htmlFor="min-path-size"
                  onDoubleClick={() =>
                    startEditing(
                      "min-path-size",
                      pathSimplificationMinPathSize01,
                    )
                  }
                >
                  Min Path Size Filter (0-1):{" "}
                  {pathSimplificationMinPathSize01.toFixed(3)}
                </Label.Root>
              )}
              <Slider.Root
                className="slider"
                id="min-path-size"
                min={0}
                max={1}
                step={0.001}
                value={[pathSimplificationMinPathSize01]}
                onValueChange={([value]) =>
                  onPathSimplificationMinPathSize01Change(value)
                }
              >
                <Slider.Track className="slider__track">
                  <Slider.Range className="slider__range" />
                </Slider.Track>
                <Slider.Thumb className="slider__thumb" />
              </Slider.Root>
            </div>

            {pathSimplificationAlgorithm !== "none" &&
              simplificationOriginalPoints !== null &&
              simplificationOptimizedPoints !== null && (
                <div className="config-panel__info">
                  <div className="config-panel__info-row">
                    <span className="config-panel__info-label">
                      Original Points:
                    </span>
                    <span className="config-panel__info-value">
                      {simplificationOriginalPoints}
                    </span>
                  </div>
                  <div className="config-panel__info-row">
                    <span className="config-panel__info-label">
                      Optimized Points:
                    </span>
                    <span className="config-panel__info-value">
                      {simplificationOptimizedPoints}
                    </span>
                  </div>
                </div>
              )}
          </>
        )}
      </div>

      {/* Export */}
      {imageMeta && (
        <div className="config-panel__section">
          <button
            className="config-panel__button config-panel__button--full"
            onClick={onCopyCLICommand}
          >
            {copyCLIButtonLabel}
          </button>
          <button
            className="config-panel__button config-panel__button--primary"
            onClick={onExportSVG}
          >
            Export SVG
          </button>
        </div>
      )}
    </div>
  );
}
