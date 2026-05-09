import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition } from '../types';

export class CloneStampTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'clone-stamp',
    name: 'Clone Stamp Tool',
    group: 'retouching',
    shortcut: 's',
    cursor: 'crosshair',
    options: [
      { name: 'size', type: 'range', default: 20, min: 1, max: 5000 },
      { name: 'hardness', type: 'range', default: 100, min: 0, max: 100 },
      { name: 'opacity', type: 'range', default: 100, min: 0, max: 100 },
      { name: 'flow', type: 'range', default: 100, min: 0, max: 100 },
      { name: 'aligned', type: 'boolean', default: true },
    ],
  };

  private sourcePoint: Point | null = null;
  private lastDrawPoint: Point | null = null;
  private offset = { x: 0, y: 0 };

  onPointerDown(e: PointerEvent): void {
    const pt = this.getCanvasPoint(e);

    if (e.altKey || !this.sourcePoint) {
      // Set source
      this.sourcePoint = pt;
      return;
    }

    super.onPointerDown(e);
    this.lastDrawPoint = pt;

    if (!this.sourcePoint) return;
    const aligned = (this.getOptions().aligned as boolean) ?? true;
    if (!aligned) {
      this.offset = { x: this.sourcePoint.x - pt.x, y: this.sourcePoint.y - pt.y };
    } else {
      this.offset = { x: this.sourcePoint.x - this.startPoint.x, y: this.sourcePoint.y - this.startPoint.y };
    }
    this.cloneAt(pt);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.lastDrawPoint || !this.ctx) return;
    const pt = this.getCanvasPoint(e);
    this.cloneStroke(this.lastDrawPoint, pt);
    this.lastDrawPoint = pt;
  }

  onPointerUp(e: PointerEvent): void {
    if (this.isDragging) {
      this.ctx?.commitCallback('Clone Stamp');
    }
    this.lastDrawPoint = null;
    super.onPointerUp(e);
  }

  private cloneAt(pt: Point): void {
    const ctx = this.getPixelContext();
    if (!ctx || !this.ctx) return;

    const opts = this.getOptions();
    const size = (opts.size as number) ?? 20;
    const opacity = ((opts.opacity as number) ?? 100) / 100;

    const layer = this.ctx.document.layers.find(l => l.id === this.ctx!.document.activeLayerId);
    if (!layer || !layer.canvas) return;

    const sx = pt.x + this.offset.x - layer.bounds.x;
    const sy = pt.y + this.offset.y - layer.bounds.y;
    const dx = pt.x - layer.bounds.x;
    const dy = pt.y - layer.bounds.y;

    // Sample from source
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(layer.canvas, sx - size / 2, sy - size / 2, size, size, 0, 0, size, size);

    // Draw to destination with opacity
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(tempCanvas, 0, 0, size, size, dx - size / 2, dy - size / 2, size, size);
    ctx.restore();
  }

  private cloneStroke(from: Point, to: Point): void {
    const size = ((this.getOptions().size as number) ?? 20) * 0.25;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const steps = Math.ceil(dist / size);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.cloneAt({ x: from.x + dx * t, y: from.y + dy * t });
    }
  }
}
