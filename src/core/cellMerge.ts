import type { CellColor, PixelPoint } from "./types";

export interface MergeCellsOptions {
  tolerance?: number;
}

export interface MergedColorBoundaries {
  color: CellColor;
  rings: PixelPoint[][];
}

interface DirectedEdge {
  from: string;
  to: string;
}

interface EdgeAccumulator {
  a: string;
  b: string;
  diff: number;
}

function colorKey(color: CellColor): string {
  return `${color.r},${color.g},${color.b},${color.a}`;
}

function parseColorKey(key: string): CellColor {
  const [r, g, b, a] = key.split(",").map(Number);
  return { r, g, b, a };
}

function quantize(value: number, tolerance: number): number {
  return Math.round(value / tolerance);
}

function pointKey(point: PixelPoint, tolerance: number): string {
  const qx = quantize(point.x, tolerance);
  const qy = quantize(point.y, tolerance);
  return `${qx},${qy}`;
}

function pointFromKey(key: string, tolerance: number): PixelPoint {
  const [qx, qy] = key.split(",").map(Number);
  return {
    x: qx * tolerance,
    y: qy * tolerance,
  };
}

function canonicalEdgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function sanitizePolygon(polygon: PixelPoint[], tolerance: number): string[] {
  const keys = polygon.map((point) => pointKey(point, tolerance));
  if (keys.length === 0) return [];

  const compact: string[] = [keys[0]];
  for (let i = 1; i < keys.length; i++) {
    if (keys[i] !== compact[compact.length - 1]) {
      compact.push(keys[i]);
    }
  }

  if (compact.length >= 2 && compact[0] === compact[compact.length - 1]) {
    compact.pop();
  }

  if (compact.length < 3) {
    return [];
  }

  return compact;
}

function buildBoundaryEdges(
  polygons: PixelPoint[][],
  tolerance: number,
): DirectedEdge[] {
  const edgeMap = new Map<string, EdgeAccumulator>();

  for (const polygon of polygons) {
    const keys = sanitizePolygon(polygon, tolerance);
    if (keys.length < 3) continue;

    for (let i = 0; i < keys.length; i++) {
      const from = keys[i];
      const to = keys[(i + 1) % keys.length];
      if (from === to) continue;

      const key = canonicalEdgeKey(from, to);
      let entry = edgeMap.get(key);
      if (!entry) {
        const [a, b] = from < to ? [from, to] : [to, from];
        entry = { a, b, diff: 0 };
        edgeMap.set(key, entry);
      }

      if (from === entry.a && to === entry.b) {
        entry.diff += 1;
      } else {
        entry.diff -= 1;
      }
    }
  }

  const edges: DirectedEdge[] = [];
  for (const entry of edgeMap.values()) {
    if (entry.diff === 0) continue;
    const count = Math.abs(entry.diff);
    const from = entry.diff > 0 ? entry.a : entry.b;
    const to = entry.diff > 0 ? entry.b : entry.a;
    for (let i = 0; i < count; i++) {
      edges.push({ from, to });
    }
  }

  return edges;
}

function vec(from: PixelPoint, to: PixelPoint): PixelPoint {
  return { x: to.x - from.x, y: to.y - from.y };
}

function turnScore(prev: PixelPoint, next: PixelPoint): number {
  const cross = prev.x * next.y - prev.y * next.x;
  const dot = prev.x * next.x + prev.y * next.y;
  return Math.atan2(cross, dot);
}

function selectNextEdge(
  current: DirectedEdge,
  candidates: number[],
  edges: DirectedEdge[],
  used: boolean[],
  tolerance: number,
): number | null {
  const currentFrom = pointFromKey(current.from, tolerance);
  const currentTo = pointFromKey(current.to, tolerance);
  const prevVec = vec(currentFrom, currentTo);

  let bestIndex: number | null = null;
  let bestScore = -Infinity;

  for (const idx of candidates) {
    if (used[idx]) continue;
    const candidate = edges[idx];
    const candidateTo = pointFromKey(candidate.to, tolerance);
    const nextVec = vec(currentTo, candidateTo);

    const score = turnScore(prevVec, nextVec);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = idx;
    }
  }

  return bestIndex;
}

function traceRings(edges: DirectedEdge[], tolerance: number): PixelPoint[][] {
  const outgoing = new Map<string, number[]>();
  edges.forEach((edge, index) => {
    const list = outgoing.get(edge.from);
    if (list) {
      list.push(index);
    } else {
      outgoing.set(edge.from, [index]);
    }
  });

  const used = new Array(edges.length).fill(false);
  const rings: PixelPoint[][] = [];

  for (let i = 0; i < edges.length; i++) {
    if (used[i]) continue;

    const startEdge = edges[i];
    const startKey = startEdge.from;
    const ringKeys: string[] = [startKey];
    let currentIndex = i;
    let guard = 0;
    const guardMax = edges.length * 4;

    while (guard < guardMax) {
      guard++;
      if (used[currentIndex]) break;
      used[currentIndex] = true;

      const current = edges[currentIndex];
      ringKeys.push(current.to);

      if (current.to === startKey) {
        break;
      }

      const candidates = outgoing.get(current.to) ?? [];
      if (candidates.length === 0) {
        break;
      }

      const nextIndex = selectNextEdge(
        current,
        candidates,
        edges,
        used,
        tolerance,
      );
      if (nextIndex === null) {
        break;
      }

      currentIndex = nextIndex;
    }

    if (ringKeys.length < 4) continue;
    if (ringKeys[ringKeys.length - 1] !== startKey) continue;

    ringKeys.pop();
    const ring = ringKeys.map((key) => pointFromKey(key, tolerance));
    if (ring.length >= 3) {
      rings.push(ring);
    }
  }

  return rings;
}

export function mergeCellsByColor(
  polygons: PixelPoint[][],
  colors: CellColor[],
  options: MergeCellsOptions = {},
): MergedColorBoundaries[] {
  const tolerance = options.tolerance ?? 1e-6;
  const groupedPolygons = new Map<string, PixelPoint[][]>();

  for (let i = 0; i < polygons.length; i++) {
    const polygon = polygons[i];
    if (!polygon || polygon.length < 3) continue;
    const key = colorKey(colors[i]);
    const list = groupedPolygons.get(key);
    if (list) {
      list.push(polygon);
    } else {
      groupedPolygons.set(key, [polygon]);
    }
  }

  const merged: MergedColorBoundaries[] = [];
  for (const [key, group] of groupedPolygons.entries()) {
    const edges = buildBoundaryEdges(group, tolerance);
    if (edges.length === 0) continue;
    const rings = traceRings(edges, tolerance);
    if (rings.length === 0) continue;
    merged.push({
      color: parseColorKey(key),
      rings,
    });
  }

  return merged;
}
