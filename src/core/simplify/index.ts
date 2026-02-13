import type { MergedColorBoundaries } from '../cellMerge';
import type { PathSimplificationAlgorithm, PixelPoint } from '../types';
import { simplifyRdpClosedRing } from './rdp';
import { simplifyRwClosedRing } from './rw';
import { simplifyVwClosedRing } from './vw';

export interface PathSimplificationOptions {
  algorithm: PathSimplificationAlgorithm;
  strength: number; // expected [0, 1]
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
  strength: number
): PixelPoint[] {
  if (ring.length <= 3) {
    return [...ring];
  }

  const scale = ringScale(ring);
  const epsilon = scale * strength * 0.05;
  const areaThreshold = Math.pow(scale * strength * 0.02, 2);

  switch (algorithm) {
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
  if (strength <= 0) {
    return groups;
  }

  return groups.map((group) => ({
    color: group.color,
    rings: group.rings.map((ring) => {
      const simplified = simplifyRing(ring, options.algorithm, strength);
      return simplified.length >= 3 ? simplified : ring;
    }),
  }));
}
