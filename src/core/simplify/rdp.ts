import type { PixelPoint } from '../types';

function perpendicularDistance(point: PixelPoint, start: PixelPoint, end: PixelPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    const px = point.x - start.x;
    const py = point.y - start.y;
    return Math.hypot(px, py);
  }

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  const projX = start.x + t * dx;
  const projY = start.y + t * dy;
  return Math.hypot(point.x - projX, point.y - projY);
}

function simplifyOpen(points: PixelPoint[], epsilon: number): PixelPoint[] {
  if (points.length <= 2) {
    return [...points];
  }

  let maxDistance = -1;
  let maxIndex = -1;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance <= epsilon || maxIndex < 0) {
    return [start, end];
  }

  const left = simplifyOpen(points.slice(0, maxIndex + 1), epsilon);
  const right = simplifyOpen(points.slice(maxIndex), epsilon);
  return [...left.slice(0, -1), ...right];
}

export function simplifyRdpClosedRing(ring: PixelPoint[], epsilon: number): PixelPoint[] {
  if (ring.length <= 3 || epsilon <= 0) {
    return [...ring];
  }

  const open = [...ring, ring[0]];
  const simplifiedOpen = simplifyOpen(open, epsilon);

  let simplified = simplifiedOpen.slice(0, -1);
  if (simplified.length < 3) {
    simplified = [...ring];
  }
  return simplified;
}
