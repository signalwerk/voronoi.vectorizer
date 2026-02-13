/**
 * Seed point generation
 * Generates uniformly random points in normalized [0,1] coordinates
 */
import { SeededRandom } from "./prng";
import type { SeedPoint, SeedStrategy } from "./types";

/**
 * Compute the number of seeds based on normalized area
 *
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @param density - Seed density per normalized area unit
 * @param strategy - How to compute normalized area
 * @returns Number of seeds to generate
 */
export function computeSeedCount(
  imageWidth: number,
  imageHeight: number,
  density: number,
  strategy: SeedStrategy = "aspect",
): number {
  const aspect = imageWidth / imageHeight;

  let normalizedArea: number;
  if (strategy === "maxAspect") {
    // Portrait and landscape with same aspect get same count
    normalizedArea = Math.max(aspect, 1 / aspect);
  } else {
    // Default: aspect ratio itself
    normalizedArea = aspect;
  }

  return Math.round(density * normalizedArea);
}

/**
 * Generate seed points uniformly in [0, 1] × [0, 1]
 *
 * @param seedCount - Number of seeds to generate
 * @param seedValue - Seed value for PRNG
 * @returns Array of seed points in normalized coordinates
 */
export function generateSeeds(
  seedCount: number,
  seedValue: string,
): SeedPoint[] {
  const rng = new SeededRandom(seedValue);
  const seeds: SeedPoint[] = [];

  for (let i = 0; i < seedCount; i++) {
    seeds.push({
      x01: rng.next(),
      y01: rng.next(),
    });
  }

  return seeds;
}

/**
 * Convert normalized seeds to pixel coordinates
 *
 * @param seeds01 - Seeds in [0,1] coordinates
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @returns Seeds in pixel coordinates
 */
export function seedsToPixels(
  seeds01: SeedPoint[],
  imageWidth: number,
  imageHeight: number,
): Array<{ x: number; y: number }> {
  return seeds01.map((seed) => ({
    x: seed.x01 * imageWidth,
    y: seed.y01 * imageHeight,
  }));
}
