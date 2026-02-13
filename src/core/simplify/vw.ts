import type { PixelPoint } from "../types";

interface Node {
  index: number;
  point: PixelPoint;
  prev: Node | null;
  next: Node | null;
  removed: boolean;
}

function triangleArea(a: PixelPoint, b: PixelPoint, c: PixelPoint): number {
  return Math.abs(
    (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2,
  );
}

export function simplifyVwClosedRing(
  ring: PixelPoint[],
  areaThreshold: number,
): PixelPoint[] {
  if (ring.length <= 3 || areaThreshold <= 0) {
    return [...ring];
  }

  const nodes: Node[] = ring.map((point, index) => ({
    index,
    point,
    prev: null,
    next: null,
    removed: false,
  }));

  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    nodes[i].prev = nodes[(i - 1 + n) % n];
    nodes[i].next = nodes[(i + 1) % n];
  }

  let activeCount = n;
  while (activeCount > 3) {
    let bestNode: Node | null = null;
    let bestArea = Infinity;

    for (const node of nodes) {
      if (node.removed || !node.prev || !node.next) continue;
      const area = triangleArea(node.prev.point, node.point, node.next.point);
      if (area < bestArea) {
        bestArea = area;
        bestNode = node;
      }
    }

    if (!bestNode || bestArea > areaThreshold) {
      break;
    }

    const prev = bestNode.prev;
    const next = bestNode.next;
    if (!prev || !next) break;

    prev.next = next;
    next.prev = prev;
    bestNode.removed = true;
    activeCount--;
  }

  return nodes.filter((node) => !node.removed).map((node) => node.point);
}
