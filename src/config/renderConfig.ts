/**
 * Global render configuration - single source of truth for styling
 * Fractions are relative to min(imageWidth, imageHeight)
 */
export const RENDER_CONFIG = {
  // Voronoi edge styling
  voronoiLineColor: '#000000',
  voronoiLineWidthFraction: 0.002, // 0.2% of min dimension
  
  // Seed point styling
  seedPointColor: '#ff0000',
  seedPointRadiusFraction: 0.002, // 0.5% of min dimension
  
  // Default UI values
  defaultSeedDensity: 80_000,
  defaultSeedValue: '12345',
};

/**
 * Convert fraction to pixels based on image dimensions
 */
export function fractionToPx(
  fraction: number,
  imageWidth: number,
  imageHeight: number
): number {
  const minDimension = Math.min(imageWidth, imageHeight);
  return fraction * minDimension;
}
