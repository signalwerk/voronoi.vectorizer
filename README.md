# Voronoi Image Vectorizer

A React + TypeScript application that transforms images into artistic Voronoi mosaics with interactive controls.

![Voronoi Image Vectorizer](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple)

## Features

- **Drag & Drop Image Upload** - Easy image loading with visual feedback
- **Voronoi Tessellation** - Generate beautiful geometric patterns from seed points
- **Seed Point Color Sampling** - Sample colors directly at seed locations for fast, vibrant results
- **Interactive Toggles**:
  - Show/hide original image overlay
  - Show/hide Voronoi edges
  - Show/hide seed points
- **Deterministic Seed Generation** - Reproducible results using seeded PRNG
- **Normalized Coordinate System** - Same aspect ratios produce same seed counts regardless of resolution
- **Export SVG** - Save your creations as vector output

## Architecture

The project follows a clean architecture with clear separation of concerns:

### Core Modules (Framework-Agnostic)

Located in `src/core/`, these modules contain pure TypeScript logic with no DOM dependencies:

- **`types.ts`** - Core type definitions
- **`prng.ts`** - Seeded pseudo-random number generator
- **`seedGeneration.ts`** - Seed point generation with normalized coordinates
- **`voronoi.ts`** - Voronoi diagram construction using d3-delaunay
- **`colorSampling.ts`** - Color sampling algorithms (seed point & cell average)
- **`pipeline.ts`** - Main pipeline orchestration

### Adapters (Replaceable)

Located in `src/adapters/`, these implement platform-specific interfaces:

- **`PixelSource.ts`** - Interface for image data access
  - `CanvasPixelSource` - Browser implementation using Canvas API
  - Future: Can add Node.js implementation
  
- **`Renderer.ts`** - Interface for drawing operations
  - `Canvas2DRenderer` - Browser implementation using Canvas 2D
  - Future: Can add SVG, WebGL, or Node canvas implementations

### React Components

Located in `src/components/`, each component has its own folder with:
- Component TypeScript file (`ComponentName.tsx`)
- BEM CSS file (`component-name.css`)

Components:
- **`Dropzone`** - Drag & drop file upload
- **`CanvasStage`** - Main rendering canvas with aspect-fit scaling
- **`ConfigPanel`** - Control panel with Radix UI primitives

### Configuration

- **`src/config/renderConfig.ts`** - Global render settings (colors, line widths, etc.)

## Installation & Usage

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Using the Application

1. **Upload an Image**: Drag & drop or click to select an image file
2. **Adjust Seed Density**: Control the number of Voronoi cells (10-500)
3. **Configure Seed Value**: Enter a seed value for reproducible results, or click "Randomize"
4. **Toggle Display Options**: Show/hide original image, edges, and seed points
5. **Choose Color Mode**: Switch between seed point color and cell average color
6. **Adjust Performance**: Lower render scale for faster processing on large images
7. **Export**: Click "Export SVG" to save your creation

## Technical Details

### Normalized Coordinate System

Seeds are generated in normalized `[0, 1] × [0, 1]` coordinates, then converted to pixel coordinates. This ensures:
- Resolution independence
- Same aspect ratio → same seed count at same density
- Portable between different rendering backends

### Seed Count Calculation

For a given density value:
- `normalizedArea = imageWidth / imageHeight` (aspect ratio)
- `seedCount = round(density × normalizedArea)`

This means:
- Square images (1:1) get exactly `density` seeds
- Wide images (16:9) get ~1.78× more seeds than tall images (9:16)
- Optional `maxAspect` strategy makes portrait/landscape symmetric

### Color Sampling

**Seed Point Color**:
- Samples one pixel at each seed location
- Nearest-neighbor interpolation
- Fast and deterministic
- Creates vibrant, high-contrast results

## Tech Stack

- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool and dev server
- **d3-delaunay** - Voronoi/Delaunay construction
- **seedrandom** - Deterministic PRNG
- **Radix UI** - Accessible UI primitives (Switch, Slider, etc.)
- **Canvas 2D API** - Rendering

## Project Structure

```
src/
├── core/                  # Framework-agnostic algorithms
│   ├── types.ts
│   ├── prng.ts
│   ├── seedGeneration.ts
│   ├── voronoi.ts
│   ├── colorSampling.ts
│   ├── pipeline.ts
│   └── __tests__/
│       └── seedGeneration.test.ts
├── adapters/             # Platform-specific implementations
│   ├── PixelSource.ts
│   └── Renderer.ts
├── components/           # React components (BEM CSS)
│   ├── Dropzone/
│   ├── CanvasStage/
│   └── ConfigPanel/
├── config/
│   └── renderConfig.ts   # Global render settings
├── App.tsx               # Main application
├── App.css
├── main.tsx
└── index.css
```

## CSS Architecture

All styles use BEM (Block Element Modifier) methodology:
- `.block` - Component root
- `.block__element` - Component part
- `.block__element--modifier` - Variant/state

No Bootstrap or utility classes. Each component has its own dedicated CSS file.

## Future Enhancements

- [ ] Node.js CLI version for batch processing
- [ ] Additional seed distribution strategies (Poisson disk, jittered grid)
- [x] SVG export option
- [ ] Custom color palettes
- [ ] Animation/morphing between configurations
- [ ] WebGL renderer for performance
- [ ] Multi-image batch processing

## License

MIT

## Author

Built with ❤️ using React + TypeScript + Vite
