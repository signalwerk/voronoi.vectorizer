import type { MergedColorBoundaries } from '../cellMerge';
import type { PathSimplificationAlgorithm, PixelPoint } from '../types';
import { simplifyRdpClosedRing } from './rdp';
import { simplifyRwClosedRing } from './rw';
import { simplifyVwClosedRing } from './vw';

export interface PathSimplificationOptions {
  algorithm: PathSimplificationAlgorithm;
  strength: number; // expected [0, 1]
  sizeCompensation: boolean;
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

  const scale = ringScale(ring);
  const rawEpsilon = scale * strength * 0.05;
  const rawAreaThreshold = Math.pow(scale * strength * 0.02, 2);
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

export function simplifyMergedBoundaries(
  groups: MergedColorBoundaries[],
  options: PathSimplificationOptions
): MergedColorBoundaries[] {
  const strength = clamp01(options.strength);
  if (strength <= 0 || options.algorithm === 'none') {
    return groups;
  }

  const allScales = groups.flatMap((group) => group.rings.map((ring) => ringScale(ring)));
  const referenceScale =
    allScales.length === 0
      ? 1
      : allScales.reduce((acc, value) => acc + value, 0) / allScales.length;

  return groups.map((group) => ({
    color: group.color,
    rings: group.rings.map((ring) => {
      const simplified = simplifyRing(
        ring,
        options.algorithm,
        strength,
        referenceScale,
        options.sizeCompensation
      );
      return simplified.length >= 3 ? simplified : ring;
    }),
  }));
}
