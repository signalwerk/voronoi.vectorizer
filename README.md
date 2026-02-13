# Voronoi Image Vectorizer

Convert images into Voronoi-style SVG artwork.

## Install

```bash
npm install
```

## GUI

```bash
npm run dev
```

Open the shown local URL (usually `http://localhost:5173`).

### GUI workflow

1. Upload an image.
2. Adjust seed density and seed value.
3. Toggle display/render options.
4. Export SVG.
5. Optional: click `Copy CLI Command` to reuse the same settings in Node.

## CLI

```bash
npm run cli -- --input ./in.jpg --output ./out.svg
```

### Common CLI options

- `--seed-density <number>`
- `--seed-value <string>`
- `--show-original true|false`
- `--show-cells true|false`
- `--show-voronoi true|false`
- `--show-seeds true|false`
- `--black-and-white-cells true|false`
- `--skip-white-cells true|false`
- `--combine-same-color-cells true|false`
- `--path-simplification-algorithm none|rdp|vw|rw`
- `--path-simplification-strength <0..1>`
- `--path-simplification-size-compensation true|false`
- `--path-simplification-min-path-size01 <0..1>`
- `--scale <number>`

Use `npm run cli -- --help` for full parameter help.

## Short Option Guide

- `black-and-white-cells`: convert cell fills to pure black/white.
- `skip-white-cells`: do not render white cells.
- `combine-same-color-cells`: merge neighboring same-color cells into compound paths.
- `path-simplification-*`: reduce path complexity after merge.

## Build

```bash
npm run build
```
