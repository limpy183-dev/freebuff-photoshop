import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition } from '../types';

export class EraserTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'eraser',
    name: 'Eraser Tool',
    group: 'painting',
    shortcut: 'e',
    cursor: 'crosshair',
    options: [
      { name: 'size', type: 'range', default: 20, min: 1, max: 5000 },
      { name: 'hardness', type: 'range', default: 100, min: 0, max: 100 },
      { name: 'opacity', type: 'range', default: 100, min: 0, max: 100 },
      { name: 'mode', type: 'enum', default: 'brush', choices: ['brush', 'pencil', 'block'] },
    ],
  };

  private eraseLastPoint: Point = { x: 0, y: 0 };
  private isEraseDragging = false;

  onPointerDown(e: PointerEvent): void {
    super.onPointerDown(e);
    this.isEraseDragging = true;
    this.eraseLastPoint = { ...this.startPoint };
    this.eraseAt(this.startPoint);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isEraseDragging) return;
    const pt = this.getCanvasPoint(e);
    this.eraseStroke(this.eraseLastPoint, pt);
    this.eraseLastPoint = pt;
  }

  onPointerUp(e: PointerEvent): void {
    if (this.isEraseDragging) {
      this.ctx?.commitCallback('Erase');
    }
    this.isEraseDragging = false;
    super.onPointerUp(e);
  }

  private eraseAt(pt: Point): void {
    const ctx = this.getPixelContext();
    if (!ctx || !this.ctx) return;

    const opts = this.getOptions();
    const size = (opts.size as number) ?? 20;
    const hardness = (opts.hardness as number) ?? 100;
    const opacity = ((opts.opacity as number) ?? 100) / 100;

    const layer = this.ctx.document.layers.find(l => l.id === this.ctx!.document.activeLayerId);
    if (!layer) return;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = opacity;

    const gradient = ctx.createRadialGradient(pt.x - layer.bounds.x, pt.y - layer.bounds.y, 0, pt.x - layer.bounds.x, pt.y - layer.bounds.y, size / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(hardness / 100, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pt.x - layer.bounds.x, pt.y - layer.bounds.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private eraseStroke(from: Point, to: Point): void {
    const opts = this.getOptions();
    const size = (opts.size as number) ?? 20;
    const spacing = size * 0.25;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const steps = Math.ceil(dist / spacing);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.eraseAt({ x: from.x + dx * t, y: from.y + dy * t });
    }
  }
}
