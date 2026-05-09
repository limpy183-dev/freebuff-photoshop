import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition, Rect } from '../types';

export class CropTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'crop',
    name: 'Crop Tool',
    group: 'crop',
    shortcut: 'c',
    cursor: 'crosshair',
    options: [
      { name: 'ratio', type: 'enum', default: 'free', choices: ['free', '1:1', '4:3', '16:9', '3:2'] },
      { name: 'deleteCropped', type: 'boolean', default: false },
    ],
  };

  private cropRect: Rect | null = null;

  onPointerDown(e: PointerEvent): void {
    super.onPointerDown(e);
    this.cropRect = { x: this.startPoint.x, y: this.startPoint.y, width: 0, height: 0 };
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.ctx || !this.cropRect) return;
    const pt = this.getCanvasPoint(e);
    let x = Math.min(this.startPoint.x, pt.x);
    let y = Math.min(this.startPoint.y, pt.y);
    let w = Math.abs(pt.x - this.startPoint.x);
    let h = Math.abs(pt.y - this.startPoint.y);

    const ratio = (this.getOptions().ratio as string) ?? 'free';
    if (ratio !== 'free') {
      const [rw, rh] = ratio.split(':').map(Number);
      const targetRatio = rw / rh;
      const currentRatio = w / h;
      if (currentRatio > targetRatio) {
        w = h * targetRatio;
      } else {
        h = w / targetRatio;
      }
    }

    this.cropRect = { x, y, width: w, height: h };
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.isDragging || !this.ctx || !this.cropRect || this.cropRect.width < 2 || this.cropRect.height < 2) {
      super.onPointerUp(e);
      return;
    }

    const doc = this.ctx.document;
    const deleteCropped = (this.getOptions().deleteCropped as boolean) ?? false;

    // Apply crop to document dimensions
    const newW = Math.round(this.cropRect.width);
    const newH = Math.round(this.cropRect.height);
    const offsetX = Math.round(this.cropRect.x);
    const offsetY = Math.round(this.cropRect.y);

    for (const layer of doc.layers) {
      if (!layer.canvas) continue;
      const ctx = layer.canvas.getContext('2d')!;
      const imageData = ctx.getImageData(offsetX - layer.bounds.x, offsetY - layer.bounds.y, newW, newH);

      const newCanvas = document.createElement('canvas');
      newCanvas.width = newW;
      newCanvas.height = newH;
      newCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
      layer.canvas = newCanvas;
      layer.bounds.x = 0;
      layer.bounds.y = 0;
      layer.bounds.width = newW;
      layer.bounds.height = newH;
    }

    doc.width = newW;
    doc.height = newH;
    this.ctx.commitCallback('Crop');
    super.onPointerUp(e);
  }
}
