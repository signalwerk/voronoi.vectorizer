# 1) Project goal

Build a **React + Vite + TypeScript** app that lets a user drop an image, generates **seed points** in **normalized coordinates**, computes a **Voronoi partition**, samples colors from the underlying image, and renders a stylized Voronoi mosaic with interactive toggles.

Key outcomes:

- Smooth UX (drag & drop, fast updates, clear controls)
- Correct and testable image pipeline
- Clean separation between:
  - **Algorithmic core** (pure logic; portable to Node)
  - **Pixel access** (browser canvas today, replaceable later)
  - **Renderer** (canvas today, replaceable later)

---

# 2) Tech constraints & standards

## 2.1 Stack

- Vite + React + TypeScript
- Canvas 2D for rendering (browser)
- **Radix UI primitives** for UI (Switch, Slider, Tabs, etc.)
- **No Bootstrap**
- Styling: **BEM CSS** in dedicated CSS files

## 2.2 Code quality

- Strict TypeScript (`"strict": true`)
- ESLint + Prettier
- Deterministic seed generation via seeded PRNG (so user can reproduce results)
- Keep algorithmic code framework-agnostic (no React imports in core)

---

# 3) UX / UI requirements

## 3.1 Layout

- Main layout: two columns
  - **Left**: canvas preview area (maintains image aspect ratio, scaled to fit)
  - **Right**: configuration panel (controls & toggles)

## 3.2 Upload

- Drag-and-drop zone + “click to upload”
- Accept common image formats: PNG/JPEG/WebP
- Once loaded, show filename, resolution, aspect ratio

## 3.3 Controls (right panel)

Required controls:

1. **Seed density**: “seed points per normalized area” (number)
2. **Seed generation seed** (integer or string) + “Randomize” button
3. Toggles:
   - Show original image (on/off)
   - Show Voronoi edges (on/off)
   - Show seed points (on/off)
   - Color mode toggle:
     - **Cell average color** (average over Voronoi region)
     - **Seed point color** (color sampled at seed point)

4. Optional (recommended for “state of the art” feel):
   - Render resolution scale (e.g., 0.5x / 1x) for performance
   - “Regenerate seeds” button
   - “Export PNG” button (saves current render)

## 3.4 Rendering rules / layering

Rendering should support these independently toggleable layers:

1. Original image layer (optional)
2. Filled Voronoi cells (always visible unless user disables mosaic)
3. Voronoi edges (optional)
4. Seed points (optional)

---

# 4) Global render configuration (single source of truth)

Provide a global config object (editable constants) controlling render styling:

- `voronoiLineColor`
- `voronoiLineWidthFraction` (fraction of min(imageWidth, imageHeight))
- `seedPointColor`
- `seedPointRadiusFraction` (fraction of min(imageWidth, imageHeight))

These fractions must be converted to px per image render size.

---

# 5) Core pipeline (must be functional)

## 5.1 Normalized coordinate system

- Every seed point is stored as:

  ```ts
  type SeedPoint = { x01: number; y01: number }; // both in [0, 1]
  ```

- Convert to pixel coords as:
  - `xPx = x01 * imageWidth`
  - `yPx = y01 * imageHeight`

## 5.2 Seed count based on “normalized area”

Your requirement: for two images with the **same aspect ratio** (e.g., 1000×1000 and 2000×2000), they must produce the **same number of seeds** at the same density setting.

Define:

- `aspect = imageWidth / imageHeight`
- `normalizedArea = aspect` _(this makes seed count depend on aspect ratio, not resolution)_

Then:

- `seedCount = round(seedDensityPerNormalizedArea * normalizedArea)`

Notes:

- For square images, normalizedArea = 1 → seedCount = density.
- For wide images (e.g., 16:9), normalizedArea ≈ 1.777 → more seeds.
- If you want portrait images to behave symmetrically (9:16 giving same count as 16:9), use:
  - `normalizedArea = max(aspect, 1/aspect)`
    Make this a small config flag if desired.

## 5.3 Seed generation

- Generate `seedCount` points uniformly random in [0,1]x[0,1]
- Use a **seeded PRNG** so results are reproducible for a given seed value
- Optional quality upgrade (recommended): allow “jittered grid” or “Poisson-ish” distribution later, but start with uniform random seeded.

## 5.4 Voronoi construction

- Use a robust library approach in browser:
  - Recommended: `d3-delaunay` (gives Delaunay and Voronoi)

- Compute Voronoi diagram bounded to image rectangle:
  - bounds = `[0, 0, width, height]`

- You must be able to:
  - Draw cell polygons (for fill)
  - Draw edges (for overlay)

## 5.5 Color sampling modes

### Mode A: “Seed point color”

- For each seed, sample the underlying image at the seed pixel coordinate
- Use nearest-neighbor sampling for v1 (fast, deterministic)
- Store color per cell = seed’s sampled color

### Mode B: “Cell average color”

- Compute the average color of **all pixels belonging to that Voronoi cell**
- Implementation must be correct and not hand-wavy:
  - Read `ImageData` once from the pixel source
  - For each pixel (x,y):
    - Determine nearest seed/cell index (Voronoi membership)
    - Accumulate `sumR,sumG,sumB,count` per cell

  - Average = sum/count

**Performance requirement:** use an efficient nearest-site query:

- With `d3-delaunay`, use `delaunay.find(x, y)` for nearest seed index.
- This yields an O(pixels) pass with fast point lookup.

**Optional performance lever (recommended):**

- Process at a downscaled resolution (user-controlled) and render scaled-up.

## 5.6 Output data model

Pipeline should produce a single “render model” object:

```ts
type CellColor = { r: number; g: number; b: number; a: number };

type PipelineOutput = {
  imageWidth: number;
  imageHeight: number;
  seeds01: SeedPoint[];
  seedsPx: { x: number; y: number }[];
  cellPolygons: Array<Array<{ x: number; y: number }>>; // one polygon per seed/cell
  cellColors: CellColor[]; // aligned by cell index
};
```

---

# 6) Architecture: browser today, Node tomorrow

This is critical: the core algorithms should not depend on DOM/canvas.

## 6.1 Modules

### A) `core/` (portable)

Pure TS functions; no React, no DOM:

- `computeSeedCount(aspect, density, strategy)`
- `generateSeeds(seedCount, seedValue) -> SeedPoint[]`
- `buildVoronoi(seedsPx, width, height) -> polygons`
- `sampleSeedColors(pixelSource, seedsPx) -> CellColor[]`
- `computeCellAverageColors(pixelSource, delaunay, width, height, scale?) -> CellColor[]`
- `runPipeline(inputs) -> PipelineOutput`

### B) `adapters/` (replaceable)

Define interfaces so the core can run in browser now and Node later.

#### Pixel source interface

```ts
export interface PixelSource {
  width: number;
  height: number;
  getImageData(): ImageDataLike; // in Node, you’ll provide a compatible structure
}

export interface ImageDataLike {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA
}
```

Browser implementation:

- `CanvasPixelSource` that draws the image onto an offscreen canvas and returns `getImageData()`.

Node implementation later:

- `NodeCanvasPixelSource` or any decoder source returning RGBA buffer.

#### Renderer interface

```ts
export interface Renderer {
  setViewportSize(cssWidth: number, cssHeight: number): void;
  clear(): void;

  drawOriginalImage?(...): void;
  drawCellFills(polygons, colors): void;
  drawVoronoiEdges(polygons, style): void;
  drawSeedPoints(points, style): void;
}
```

Browser implementation:

- `Canvas2DRenderer` using `<canvas>`.

Node later:

- swap with another backend.

## 6.2 React app responsibilities

React layer should only:

- Load image file
- Manage UI state
- Call pipeline
- Tell renderer what to draw
- Keep canvas sized to container while preserving aspect ratio

---

# 7) State model (React)

Recommended state shape:

```ts
type AppState = {
  imageFile?: File;
  imageMeta?: { width: number; height: number; name: string };

  seedDensity: number; // “per normalized area”
  seedValue: string; // PRNG seed
  seedStrategy: "aspect" | "maxAspect"; // optional

  showOriginal: boolean;
  showVoronoi: boolean;
  showSeeds: boolean;
  colorMode: "cellAverage" | "seedPoint";
  renderScale: number; // optional: 1, 0.5, etc.

  pipelineOutput?: PipelineOutput;
  isProcessing: boolean;
  error?: string;
};
```

Processing triggers:

- When image loads
- When density/seed/strategy changes → regenerate seeds & rerun pipeline
- When toggles change → **no need to recompute**; only re-render layers
- When colorMode changes:
  - seedPoint mode may be cheap
  - cellAverage requires recompute of colors (but not polygons)

---

# 8) Performance & correctness requirements

- Avoid repeated `getImageData()` calls—fetch once per pipeline run.
- Use `requestAnimationFrame` to schedule drawing, keep UI responsive.
- For cell-average mode:
  - Offer a renderScale option or internal downsampling to prevent UI lock on large images.

- Provide a visible progress indicator when processing large images.

Correctness checks:

- Seed count matches density × normalizedArea definition.
- Same aspect ratio, different resolutions → same seed count.
- Average colors computed by proper pixel membership via nearest-seed rule.

---

# 9) File & component structure (BEM CSS)

## 9.1 Component folder rule

Each component lives in:
`/components/<ComponentName>/`

- `<ComponentName>.tsx`
- `<component-name>.css`

Example:

```
src/
  components/
    Dropzone/
      Dropzone.tsx
      dropzone.css
    ConfigPanel/
      ConfigPanel.tsx
      config-panel.css
    CanvasStage/
      CanvasStage.tsx
      canvas-stage.css
    ToggleRow/
      ToggleRow.tsx
      toggle-row.css
```

## 9.2 BEM rules

- No utility classes, no bootstrap
- Examples:
  - `.config-panel`, `.config-panel__section`, `.config-panel__row`, `.config-panel__row--disabled`
  - `.dropzone`, `.dropzone__hint`, `.dropzone--active`

---

# 10) Suggested library choices

- Voronoi: `d3-delaunay`
- UI primitives: `@radix-ui/react-switch`, `@radix-ui/react-slider`, `@radix-ui/react-tabs`, `@radix-ui/react-label`
- state store: keep it in React state/hooks for v1.

---

# 11) Deliverables checklist for the coding agent

1. Vite React TS app scaffold
2. Drag-and-drop upload works, image loads reliably
3. Canvas preview with aspect-fit scaling
4. Pipeline fully implemented:
   - Seed count from normalized area
   - Seed generation with deterministic PRNG
   - Voronoi generation
   - Seed color sampling
   - Cell average color sampling (correct membership + averaging)

5. UI panel with all required controls and toggles
6. Global render config variables for colors and fractions
7. Architecture with `core/` pure logic + adapter interfaces
8. Clean BEM CSS per component folder
9. Export PNG (recommended)
10. Minimal tests for core functions (at least seed count + deterministic seeds)
