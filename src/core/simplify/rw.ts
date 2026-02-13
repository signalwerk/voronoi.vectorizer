import type { PixelPoint } from "../types";

function pointLineDistance(
  point: PixelPoint,
  start: PixelPoint,
  end: PixelPoint,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  return (
    Math.abs((point.x - start.x) * dy - (point.y - start.y) * dx) /
    Math.hypot(dx, dy)
  );
}

function simplifyOpenRw(points: PixelPoint[], epsilon: number): PixelPoint[] {
  if (points.length <= 2 || epsilon <= 0) {
    return [...points];
  }

  const simplified: PixelPoint[] = [points[0]];
  let anchor = points[0];
  let i = 1;

  while (i < points.length - 1) {
    const testPoint = points[i + 1];
    const distance = pointLineDistance(points[i], anchor, testPoint);

    if (distance > epsilon) {
      simplified.push(points[i]);
      anchor = points[i];
    }

    i++;
  }

  simplified.push(points[points.length - 1]);
  return simplified;
}

export function simplifyRwClosedRing(
  ring: PixelPoint[],
  epsilon: number,
): PixelPoint[] {
  if (ring.length <= 3 || epsilon <= 0) {
    return [...ring];
  }

  const open = [...ring, ring[0]];
  const simplifiedOpen = simplifyOpenRw(open, epsilon);
  let simplified = simplifiedOpen.slice(0, -1);

  if (simplified.length < 3) {
    simplified = [...ring];
  }
  return simplified;
}
