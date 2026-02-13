import type { MergedColorBoundaries } from '../cellMerge';
import type { PathSimplificationAlgorithm, PixelPoint } from '../types';
import { simplifyRdpClosedRing } from './rdp';
import { simplifyRwClosedRing } from './rw';
import { simplifyVwClosedRing } from './vw';

export interface PathSimplificationOptions {
  algorithm: PathSimplificationAlgorithm;
  strength: number; // expected [0, 1]
  sizeCompensation: boolean;
  minPathSize: number; // absolute size threshold in current coordinate space
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function ringScale(ring: PixelPoint[]): number {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of ring) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const dx = maxX - minX;
  const dy = maxY - minY;
  return Math.max(1, Math.hypot(dx, dy));
}

function simplifyRing(
  ring: PixelPoint[],
  algorithm: PathSimplificationAlgorithm,
  strength: number,
  referenceScale: number,
  sizeCompensation: boolean
): PixelPoint[] {
  if (ring.length <= 3) {
    return [...ring];
  }

  const algorithmStrengthMultiplier = algorithm === 'vw' ? 4 : 1;
  const tunedStrength = strength * algorithmStrengthMultiplier;
  const scale = ringScale(ring);
  const rawEpsilon = scale * tunedStrength * 0.05;
  const rawAreaThreshold = Math.pow(scale * tunedStrength * 0.02, 2);
  const compensation = sizeCompensation ? referenceScale / scale : 1;
  const epsilon = rawEpsilon * compensation;
  const areaThreshold = rawAreaThreshold * compensation * compensation;

  switch (algorithm) {
    case 'none':
      return [...ring];
    case 'rdp':
      return simplifyRdpClosedRing(ring, epsilon);
    case 'vw':
      return simplifyVwClosedRing(ring, areaThreshold);
    case 'rw':
      return simplifyRwClosedRing(ring, epsilon);
    default:
      return [...ring];
  }
}

function ringMaxDimension(ring: PixelPoint[]): number {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of ring) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return Math.max(maxX - minX, maxY - minY);
}

export function simplifyMergedBoundaries(
  groups: MergedColorBoundaries[],
  options: PathSimplificationOptions
): MergedColorBoundaries[] {
  const strength = clamp01(options.strength);
  const doSimplify = strength > 0 && options.algorithm !== 'none';

  const allScales = groups.flatMap((group) =>
    group.rings.map((ring) => (doSimplify ? ringScale(ring) : 1))
  );
  const referenceScale =
    allScales.length === 0
      ? 1
      : allScales.reduce((acc, value) => acc + value, 0) / allScales.length;

  const minPathSize = Math.max(0, options.minPathSize);
  const out: MergedColorBoundaries[] = [];

  for (const group of groups) {
    const rings = group.rings
      .map((ring) => {
        if (!doSimplify) return ring;
        const simplified = simplifyRing(
          ring,
          options.algorithm,
          strength,
          referenceScale,
          options.sizeCompensation
        );
        return simplified.length >= 3 ? simplified : ring;
      })
      .filter((ring) => ringMaxDimension(ring) >= minPathSize);

    if (rings.length > 0) {
      out.push({ color: group.color, rings });
    }
  }

  return out;
}
