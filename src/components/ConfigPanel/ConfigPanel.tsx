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
  showVoronoi: boolean;
  showSeeds: boolean;
  colorMode: 'cellAverage' | 'seedPoint';
  renderScale: number;
  onSeedDensityChange: (value: number) => void;
  onSeedValueChange: (value: string) => void;
  onRandomizeSeed: () => void;
  onShowOriginalChange: (value: boolean) => void;
  onShowVoronoiChange: (value: boolean) => void;
  onShowSeedsChange: (value: boolean) => void;
  onColorModeChange: (value: 'cellAverage' | 'seedPoint') => void;
  onRenderScaleChange: (value: number) => void;
  onExportPNG: () => void;
}

export function ConfigPanel({
  imageMeta,
  seedDensity,
  seedValue,
  showOriginal,
  showVoronoi,
  showSeeds,
  colorMode,
  renderScale,
  onSeedDensityChange,
  onSeedValueChange,
  onRandomizeSeed,
  onShowOriginalChange,
  onShowVoronoiChange,
  onShowSeedsChange,
  onColorModeChange,
  onRenderScaleChange,
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
      
      {/* Color Mode */}
      <div className="config-panel__section">
        <h3 className="config-panel__title">Color Mode</h3>
        
        <div className="config-panel__radio-group">
          <label className="config-panel__radio">
            <input
              type="radio"
              name="colorMode"
              value="seedPoint"
              checked={colorMode === 'seedPoint'}
              onChange={() => onColorModeChange('seedPoint')}
            />
            <span>Seed Point Color</span>
          </label>
          
          <label className="config-panel__radio">
            <input
              type="radio"
              name="colorMode"
              value="cellAverage"
              checked={colorMode === 'cellAverage'}
              onChange={() => onColorModeChange('cellAverage')}
            />
            <span>Cell Average Color</span>
          </label>
        </div>
      </div>
      
      {/* Performance */}
      <div className="config-panel__section">
        <h3 className="config-panel__title">Performance</h3>
        
        <div className="config-panel__control">
          <Label.Root className="config-panel__label" htmlFor="scale">
            Render Scale: {renderScale}x
          </Label.Root>
          <Slider.Root
            className="slider"
            id="scale"
            min={0.25}
            max={1}
            step={0.25}
            value={[renderScale]}
            onValueChange={([value]) => onRenderScaleChange(value)}
          >
            <Slider.Track className="slider__track">
              <Slider.Range className="slider__range" />
            </Slider.Track>
            <Slider.Thumb className="slider__thumb" />
          </Slider.Root>
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
