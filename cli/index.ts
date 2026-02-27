import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BufferPixelSource } from "../src/adapters/PixelSource";
import { runPipeline } from "../src/core/pipeline";
import { computeSimplificationPointStats } from "../src/core/simplificationStats";
import { buildVoronoiSvg } from "../src/core/svgExport";
import type {
  PathSimplificationAlgorithm,
  SeedStrategy,
} from "../src/core/types";
import { RENDER_CONFIG } from "../src/config/renderConfig";

interface CliOptions {
  input: string;
  output?: string;
  seedDensity: number;
  seedValue: string;
  seedStrategy: SeedStrategy;
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
  scale: number;
}

function usage(): string {
  return [
    "Usage:",
    "  npm run cli -- --input <path> [options]",
    "",
    "Options:",
    "  --input <path>            Input image path (required)",
    "  --output <path>           Output SVG path (default: <input>.svg)",
    "  --seed-density <number>   Seed density (default: 100)",
    "  --seed-value <string>     Seed value (default: 12345)",
    "  --seed-strategy <mode>    aspect|maxAspect (default: aspect)",
    "  --show-original <bool>    true|false (default: false)",
    "  --show-cells <bool>       true|false (default: true)",
    "  --show-voronoi <bool>     true|false (default: true)",
    "  --show-seeds <bool>       true|false (default: false)",
    "  --black-and-white-cells <bool>  true|false (default: false)",
    "  --skip-white-cells <bool>       true|false (default: false)",
    "  --combine-same-color-cells <bool> true|false (default: false)",
    "  --path-simplification-algorithm <name> none|rdp|vw|rw (default: none)",
    "  --path-simplification-strength <number> 0..1 (default: 0)",
    "  --path-simplification-size-compensation <bool> true|false (default: false)",
    "  --path-simplification-min-path-size01 <number> 0..1 (default: 0)",
    "  --seed-point-radius <number> 0..1 (default: 0.002)",
    "  --scale <number>          Output scale factor (default: 1)",
    "  --help                    Show this help",
  ].join("\n");
}

function toBool(value: string, name: string): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(
    `Invalid value for ${name}: ${value} (expected true or false)`,
  );
}

function toNumber(value: string, name: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid numeric value for ${name}: ${value}`);
  }
  return n;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    input: "",
    output: undefined,
    seedDensity: RENDER_CONFIG.defaultSeedDensity,
    seedValue: RENDER_CONFIG.defaultSeedValue,
    seedStrategy: "aspect",
    showOriginal: false,
    showCells: true,
    showVoronoi: true,
    showSeeds: false,
    blackAndWhiteCells: false,
    skipWhiteCells: false,
    combineSameColorCells: false,
    pathSimplificationAlgorithm: "none",
    pathSimplificationStrength: 0,
    pathSimplificationSizeCompensation: false,
    pathSimplificationMinPathSize01: 0,
    seedPointRadiusFraction: RENDER_CONFIG.seedPointRadiusFraction,
    scale: 1,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help") {
      console.log(usage());
      process.exit(0);
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }

    switch (arg) {
      case "--input":
        options.input = value;
        break;
      case "--output":
        options.output = value;
        break;
      case "--seed-density":
        options.seedDensity = toNumber(value, "--seed-density");
        break;
      case "--seed-value":
        options.seedValue = value;
        break;
      case "--seed-strategy":
        if (value !== "aspect" && value !== "maxAspect") {
          throw new Error(`Invalid --seed-strategy: ${value}`);
        }
        options.seedStrategy = value;
        break;
      case "--show-original":
        options.showOriginal = toBool(value, "--show-original");
        break;
      case "--show-cells":
        options.showCells = toBool(value, "--show-cells");
        break;
      case "--show-voronoi":
        options.showVoronoi = toBool(value, "--show-voronoi");
        break;
      case "--show-seeds":
        options.showSeeds = toBool(value, "--show-seeds");
        break;
      case "--black-and-white-cells":
        options.blackAndWhiteCells = toBool(value, "--black-and-white-cells");
        break;
      case "--skip-white-cells":
        options.skipWhiteCells = toBool(value, "--skip-white-cells");
        break;
      case "--combine-same-color-cells":
        options.combineSameColorCells = toBool(
          value,
          "--combine-same-color-cells",
        );
        break;
      case "--path-simplification-algorithm":
        if (
          value !== "none" &&
          value !== "rdp" &&
          value !== "vw" &&
          value !== "rw"
        ) {
          throw new Error(`Invalid --path-simplification-algorithm: ${value}`);
        }
        options.pathSimplificationAlgorithm = value;
        break;
      case "--path-simplification-strength":
        options.pathSimplificationStrength = toNumber(
          value,
          "--path-simplification-strength",
        );
        break;
      case "--path-simplification-size-compensation":
        options.pathSimplificationSizeCompensation = toBool(
          value,
          "--path-simplification-size-compensation",
        );
        break;
      case "--path-simplification-min-path-size01":
        options.pathSimplificationMinPathSize01 = toNumber(
          value,
          "--path-simplification-min-path-size01",
        );
        break;
      case "--seed-point-radius":
        options.seedPointRadiusFraction = toNumber(
          value,
          "--seed-point-radius",
        );
        break;
      case "--scale":
        options.scale = toNumber(value, "--scale");
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }

    i += 1;
  }

  if (!options.input) {
    throw new Error("--input is required");
  }

  if (options.seedDensity <= 0) {
    throw new Error("--seed-density must be > 0");
  }

  if (options.scale <= 0) {
    throw new Error("--scale must be > 0");
  }

  if (
    options.pathSimplificationStrength < 0 ||
    options.pathSimplificationStrength > 1
  ) {
    throw new Error("--path-simplification-strength must be in [0, 1]");
  }

  if (
    options.pathSimplificationMinPathSize01 < 0 ||
    options.pathSimplificationMinPathSize01 > 1
  ) {
    throw new Error("--path-simplification-min-path-size01 must be in [0, 1]");
  }

  if (
    options.seedPointRadiusFraction < 0 ||
    options.seedPointRadiusFraction > 1
  ) {
    throw new Error("--seed-point-radius must be in [0, 1]");
  }

  return options;
}

function defaultOutputPath(inputPath: string): string {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.svg`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const raw = await sharp(options.input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelSource = new BufferPixelSource(
    raw.info.width,
    raw.info.height,
    new Uint8ClampedArray(
      raw.data.buffer,
      raw.data.byteOffset,
      raw.data.byteLength,
    ),
  );

  const output = runPipeline(
    {
      imageWidth: raw.info.width,
      imageHeight: raw.info.height,
      seedDensity: options.seedDensity,
      seedValue: options.seedValue,
      seedStrategy: options.seedStrategy,
      colorMode: "seedPoint",
    },
    pixelSource,
  );

  const outPath = options.output ?? defaultOutputPath(options.input);
  let originalImageDataUrl: string | undefined;
  if (options.showOriginal) {
    const sourceBuffer = await fs.readFile(options.input);
    const format = (await sharp(sourceBuffer).metadata()).format ?? "png";
    const mimeType = format === "jpeg" ? "image/jpeg" : `image/${format}`;
    originalImageDataUrl = `data:${mimeType};base64,${sourceBuffer.toString("base64")}`;
  }
  const svg = buildVoronoiSvg(output, {
    width: output.imageWidth * options.scale,
    height: output.imageHeight * options.scale,
    showOriginal: options.showOriginal,
    originalImageDataUrl,
    showCells: options.showCells,
    showVoronoi: options.showVoronoi,
    showSeeds: options.showSeeds,
    blackAndWhiteCells: options.blackAndWhiteCells,
    skipWhiteCells: options.skipWhiteCells,
    combineSameColorCells: options.combineSameColorCells,
    pathSimplificationAlgorithm: options.pathSimplificationAlgorithm,
    pathSimplificationStrength: options.pathSimplificationStrength,
    pathSimplificationSizeCompensation:
      options.pathSimplificationSizeCompensation,
    pathSimplificationMinPathSize01: options.pathSimplificationMinPathSize01,
    seedPointRadiusFraction: options.seedPointRadiusFraction,
  });
  await fs.writeFile(outPath, svg, "utf8");

  console.log(`Input: ${options.input}`);
  console.log(`Output: ${outPath}`);
  console.log(`Seeds: ${output.seedsPx.length}`);
  const simplificationStats = computeSimplificationPointStats(output, {
    blackAndWhiteCells: options.blackAndWhiteCells,
    skipWhiteCells: options.skipWhiteCells,
    combineSameColorCells: options.combineSameColorCells,
    pathSimplificationAlgorithm: options.pathSimplificationAlgorithm,
    pathSimplificationStrength: options.pathSimplificationStrength,
    pathSimplificationSizeCompensation:
      options.pathSimplificationSizeCompensation,
    pathSimplificationMinPathSize01: options.pathSimplificationMinPathSize01,
  });
  if (simplificationStats) {
    console.log(`Original Points: ${simplificationStats.originalPoints}`);
    console.log(`Optimized Points: ${simplificationStats.optimizedPoints}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`CLI error: ${message}`);
  console.error("");
  console.error(usage());
  process.exit(1);
});
