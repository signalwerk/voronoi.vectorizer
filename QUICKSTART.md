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

### 3. Export Your Creation
Click **Export PNG** to download the current canvas as a PNG file.

## 🎨 Tips for Best Results

### For Photos
- Try density 100-300 for portrait-style effect
- Enable **Show Voronoi Edges** for geometric emphasis
- Experiment with different seed values for variation

### For Abstract Art
- Try low density (10-50) for bold geometric shapes
- Disable edges for a cleaner look
- Use high density (300-500) for intricate patterns

### For Best Workflow
- Start with low density while experimenting
- Adjust density to find your preferred level of detail
- Use the Randomize button to quickly explore variations

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
