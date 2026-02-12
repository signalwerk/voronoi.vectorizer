/**
 * PixelSource interface and browser implementation
 * Adapter pattern for image data access
 */
import type { ImageDataLike } from '../core/colorSampling';

/**
 * Abstract interface for accessing pixel data
 * Can be implemented for browser (canvas) or Node (buffer)
 */
export interface PixelSource {
  width: number;
  height: number;
  getImageData(): ImageDataLike;
}

/**
 * Browser implementation using Canvas API
 */
export class CanvasPixelSource implements PixelSource {
  public readonly width: number;
  public readonly height: number;
  
  private imageData: ImageDataLike | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor(image: HTMLImageElement) {
    this.width = image.naturalWidth;
    this.height = image.naturalHeight;
    
    // Create offscreen canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    
    // Draw image to canvas
    this.ctx.drawImage(image, 0, 0);
  }
  
  /**
   * Get image data (cached after first call)
   */
  getImageData(): ImageDataLike {
    if (!this.imageData) {
      this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    }
    return this.imageData;
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.imageData = null;
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}

/**
 * Node/buffer implementation for CLI usage
 */
export class BufferPixelSource implements PixelSource {
  public readonly width: number;
  public readonly height: number;
  private readonly data: Uint8ClampedArray;

  constructor(width: number, height: number, data: Uint8ClampedArray) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  getImageData(): ImageDataLike {
    return {
      width: this.width,
      height: this.height,
      data: this.data,
    };
  }
}
