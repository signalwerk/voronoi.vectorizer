# Quick Start Guide

## 🚀 Running the Application

The development server is already running at:
**http://localhost:5173/**

If you need to restart it:
```bash
npm run dev
```

## 📖 How to Use

### 1. Upload an Image
- **Drag & drop** an image onto the dropzone, or
- **Click** the dropzone to select a file
- Supported formats: PNG, JPEG, WebP

### 2. Explore the Controls

Once an image is loaded, you'll see the control panel on the right:

#### **Seed Configuration**
- **Seed Density (10-500)**: Controls how many Voronoi cells are created
  - Low values (10-50): Large, chunky cells
  - Medium values (100-200): Balanced mosaic effect
  - High values (300-500): Fine-grained tessellation

- **Seed Value**: Text input for the random seed
  - Same seed = same pattern (reproducible)
  - Click **Randomize** to generate a new pattern

#### **Display Options**
Toggle these on/off to see different layers:
- **Show Original Image**: Overlay the source image (translucent)
- **Show Voronoi Edges**: Draw cell boundaries
- **Show Seed Points**: Display red dots at seed locations

#### **Color Mode**
- **Seed Point Color**: Fast - samples color at each seed location
- **Cell Average Color**: Accurate - averages all pixels in each cell

#### **Performance**
- **Render Scale (0.25x - 1x)**: For cell average mode on large images
  - 1x = full resolution (slow but accurate)
  - 0.5x = half resolution (4x faster, similar quality)
  - 0.25x = quarter resolution (16x faster, rougher)

### 3. Export Your Creation
Click **Export PNG** to download the current canvas as a PNG file.

## 🎨 Tips for Best Results

### For Photos
- Use **Cell Average Color** mode for smooth color transitions
- Try density 100-300 for portrait-style effect
- Enable **Show Voronoi Edges** for geometric emphasis

### For Abstract Art
- Use **Seed Point Color** for sharper, more vibrant results
- Try low density (10-50) for bold geometric shapes
- Disable edges for a cleaner look

### For Performance
- Start with low density while experimenting
- Use **Seed Point Color** for instant feedback
- Lower **Render Scale** when using Cell Average on large images

## 🧪 Test the Seed Calculation

Run the test suite to verify core algorithms:
```bash
npx tsx src/core/__tests__/seedGeneration.test.ts
```

Expected output:
```
✓ All seed generation tests passed!
```

## 🏗️ Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

Preview the production build:
```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── core/           # Pure algorithms (portable)
├── adapters/       # Platform-specific (Canvas)
├── components/     # React UI components
├── config/         # Global settings
└── App.tsx         # Main application
```

## 🔧 Customization

### Change Colors
Edit `src/config/renderConfig.ts`:
```typescript
voronoiLineColor: '#000000',    // Edge color
seedPointColor: '#ff0000',      // Seed point color
```

### Change Line Thickness
Edit `src/config/renderConfig.ts`:
```typescript
voronoiLineWidthFraction: 0.002,  // 0.2% of min dimension
seedPointRadiusFraction: 0.005,   // 0.5% of min dimension
```

## 📚 Documentation

- **README.md** - Full project documentation
- **IMPLEMENTATION.md** - Technical implementation details
- **This file (QUICKSTART.md)** - Getting started guide

## 🎉 Enjoy!

Have fun creating artistic Voronoi mosaics! Experiment with different settings to discover unique visual styles.
