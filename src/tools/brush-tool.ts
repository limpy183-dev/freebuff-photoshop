import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition, ColorRGB } from '../types';

export class BrushTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'brush',
    name: 'Brush Tool',
    group: 'painting',
    shortcut: 'b',
    cursor: 'crosshair',
    options: [
      { name: 'size', type: 'range', default: 20, min: 1, max: 5000 },
      { name: 'hardness', type: 'range', default: 100, min: 0, max: 100 },
      { name: 'opacity', type: 'range', default: 100, min: 0, max: 100 },
      { name: 'flow', type: 'range', default: 100, min: 0, max: 100 },
      { name: 'spacing', type: 'range', default: 25, min: 1, max: 1000 },
      { name: 'smoothing', type: 'range', default: 0, min: 0, max: 100 },
    ],
  };

  private lastDrawPoint: Point | null = null;
  private accumulatedDistance = 0;

  activate(context: ToolContext): void {
    super.activate(context);
  }

  onPointerDown(e: PointerEvent): void {
    super.onPointerDown(e);
    this.lastDrawPoint = this.startPoint;
    this.accumulatedDistance = 0;
    this.drawDab(this.startPoint);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.lastDrawPoint) return;
    const pt = this.getCanvasPoint(e);
    this.drawStroke(this.lastDrawPoint, pt);
    this.lastDrawPoint = pt;
  }

  onPointerUp(e: PointerEvent): void {
    if (this.isDragging) {
      this.ctx?.commitCallback('Brush Stroke');
    }
    this.lastDrawPoint = null;
    super.onPointerUp(e);
  }

  private drawDab(pt: Point): void {
    const ctx = this.getPixelContext();
    if (!ctx || !this.ctx) return;

    const opts = this.getOptions();
    const size = (opts.size as number) ?? 20;
    const hardness = (opts.hardness as number) ?? 100;
    const opacity = ((opts.opacity as number) ?? 100) / 100;
    const color = this.ctx.appState.foregroundColor;

    const layer = this.ctx.document.layers.find(l => l.id === this.ctx!.document.activeLayerId);
    if (!layer) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const gradient = ctx.createRadialGradient(pt.x - layer.bounds.x, pt.y - layer.bounds.y, 0, pt.x - layer.bounds.x, pt.y - layer.bounds.y, size / 2);
    gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},1)`);
    gradient.addColorStop(hardness / 100, `rgba(${color.r},${color.g},${color.b},1)`);
    gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pt.x - layer.bounds.x, pt.y - layer.bounds.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawStroke(from: Point, to: Point): void {
    const opts = this.getOptions();
    const size = (opts.size as number) ?? 20;
    const spacing = ((opts.spacing as number) ?? 25) / 100 * size;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return;

    const steps = Math.ceil(dist / spacing);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const y = from.y + dy * t;
      this.drawDab({ x, y });
    }
  }
}
