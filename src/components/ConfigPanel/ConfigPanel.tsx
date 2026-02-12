import * as Switch from '@radix-ui/react-switch';
import * as Label from '@radix-ui/react-label';
import * as Slider from '@radix-ui/react-slider';
import './config-panel.css';

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
  onSeedDensityChange: (value: number) => void;
  onSeedValueChange: (value: string) => void;
  onRandomizeSeed: () => void;
  onShowOriginalChange: (value: boolean) => void;
  onShowCellsChange: (value: boolean) => void;
  onShowVoronoiChange: (value: boolean) => void;
  onShowSeedsChange: (value: boolean) => void;
  onExportPNG: () => void;
}

export function ConfigPanel({
  imageMeta,
  seedDensity,
  seedValue,
  showOriginal,
  showCells,
  showVoronoi,
  showSeeds,
  onSeedDensityChange,
  onSeedValueChange,
  onRandomizeSeed,
  onShowOriginalChange,
  onShowCellsChange,
  onShowVoronoiChange,
  onShowSeedsChange,
  onExportPNG,
}: ConfigPanelProps) {
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
          <Label.Root className="config-panel__label" htmlFor="density">
            Seed Density: {seedDensity}
          </Label.Root>
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
            <button
              className="config-panel__button"
              onClick={onRandomizeSeed}
            >
              Randomize
            </button>
          </div>
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
      </div>
      
      {/* Export */}
      {imageMeta && (
        <div className="config-panel__section">
          <button
            className="config-panel__button config-panel__button--primary"
            onClick={onExportPNG}
          >
            Export PNG
          </button>
        </div>
      )}
    </div>
  );
}
