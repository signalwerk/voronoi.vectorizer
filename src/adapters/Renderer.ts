/**
 * Renderer interface and browser Canvas2D implementation
 * Adapter pattern for drawing operations
 */
import type { CellColor, PixelPoint } from "../core/types";

export interface DrawStyle {
  lineColor?: string;
  lineWidth?: number;
  fillColor?: string;
  pointColor?: string;
  pointRadius?: number;
}

/**
 * Abstract renderer interface
 * Can be implemented for canvas, SVG, Node canvas, etc.
 */
export interface Renderer {
  setViewportSize(cssWidth: number, cssHeight: number): void;
  clear(): void;
  drawOriginalImage?(
    image: HTMLImageElement,
    width: number,
    height: number,
    x?: number,
    y?: number,
  ): void;
  drawCellFills(polygons: PixelPoint[][], colors: CellColor[]): void;
  drawMergedCellFills?(
    groups: { color: CellColor; rings: PixelPoint[][] }[],
  ): void;
  drawVoronoiEdges(polygons: PixelPoint[][], style: DrawStyle): void;
  drawSeedPoints(points: PixelPoint[], style: DrawStyle): void;
}

/**
 * Browser Canvas2D implementation
 */
export class Canvas2DRenderer implements Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;
  }

  /**
   * Set canvas size (both CSS and buffer size)
   */
  setViewportSize(cssWidth: number, cssHeight: number): void {
    // Set CSS size
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    // Set buffer size (match CSS for 1:1 pixel ratio)
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = cssWidth * dpr;
    this.canvas.height = cssHeight * dpr;

    // Scale context to match DPR
    this.ctx.scale(dpr, dpr);
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
  }

  /**
   * Draw the original image
   */
  drawOriginalImage(
    image: HTMLImageElement,
    width: number,
    height: number,
    x: number = 0,
    y: number = 0,
  ): void {
    this.ctx.drawImage(image, x, y, width, height);
  }

  /**
   * Draw filled Voronoi cells
   */
  drawCellFills(polygons: PixelPoint[][], colors: CellColor[]): void {
    polygons.forEach((polygon, index) => {
      if (polygon.length === 0) return;

      const color = colors[index];
      this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;

      this.ctx.beginPath();
      this.ctx.moveTo(polygon[0].x, polygon[0].y);
      for (let i = 1; i < polygon.length; i++) {
        this.ctx.lineTo(polygon[i].x, polygon[i].y);
      }
      this.ctx.closePath();
      this.ctx.fill();
    });
  }

  /**
   * Draw merged cell fills (compound paths with possible holes)
   */
  drawMergedCellFills(
    groups: { color: CellColor; rings: PixelPoint[][] }[],
  ): void {
    groups.forEach((group) => {
      this.ctx.fillStyle = `rgba(${group.color.r}, ${group.color.g}, ${group.color.b}, ${group.color.a / 255})`;
      this.ctx.beginPath();

      group.rings.forEach((ring) => {
        if (ring.length === 0) return;
        this.ctx.moveTo(ring[0].x, ring[0].y);
        for (let i = 1; i < ring.length; i++) {
          this.ctx.lineTo(ring[i].x, ring[i].y);
        }
        this.ctx.closePath();
      });

      this.ctx.fill("evenodd");
    });
  }

  /**
   * Draw Voronoi cell edges
   */
  drawVoronoiEdges(polygons: PixelPoint[][], style: DrawStyle): void {
    this.ctx.strokeStyle = style.lineColor || "#000000";
    this.ctx.lineWidth = style.lineWidth || 1;

    polygons.forEach((polygon) => {
      if (polygon.length === 0) return;

      this.ctx.beginPath();
      this.ctx.moveTo(polygon[0].x, polygon[0].y);
      for (let i = 1; i < polygon.length; i++) {
        this.ctx.lineTo(polygon[i].x, polygon[i].y);
      }
      this.ctx.closePath();
      this.ctx.stroke();
    });
  }

  /**
   * Draw seed points
   */
  drawSeedPoints(points: PixelPoint[], style: DrawStyle): void {
    this.ctx.fillStyle = style.pointColor || "#ff0000";
    const radius = style.pointRadius || 3;

    points.forEach((point) => {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      this.ctx.fill();
    });
  }
}
