import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition } from '../types';

export class GradientTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'gradient',
    name: 'Gradient Tool',
    group: 'painting',
    shortcut: 'g',
    cursor: 'crosshair',
    options: [
      { name: 'type', type: 'enum', default: 'linear', choices: ['linear', 'radial', 'angle', 'reflected', 'diamond'] },
      { name: 'mode', type: 'enum', default: 'normal', choices: ['normal', 'multiply', 'screen', 'overlay'] },
      { name: 'opacity', type: 'range', default: 100, min: 0, max: 100 },
      { name: 'reverse', type: 'boolean', default: false },
      { name: 'dither', type: 'boolean', default: true },
    ],
  };

  onPointerDown(e: PointerEvent): void {
    super.onPointerDown(e);
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.ctx) return;
    const pt = this.getCanvasPoint(e);
    const ctx = this.getPixelContext();
    if (!ctx) return;

    const layer = this.ctx.document.layers.find(l => l.id === this.ctx!.document.activeLayerId);
    if (!layer) return;

    const type = (this.getOptions().type as string) ?? 'linear';
    const opacity = ((this.getOptions().opacity as number) ?? 100) / 100;
    const reverse = (this.getOptions().reverse as boolean) ?? false;
    const fg = this.ctx.appState.foregroundColor;
    const bg = this.ctx.appState.backgroundColor;
    const c1 = reverse ? `rgba(${bg.r},${bg.g},${bg.b},${opacity})` : `rgba(${fg.r},${fg.g},${fg.b},${opacity})`;
    const c2 = reverse ? `rgba(${fg.r},${fg.g},${fg.b},${opacity})` : `rgba(${bg.r},${bg.g},${bg.b},${opacity})`;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (type === 'linear') {
      const grad = ctx.createLinearGradient(
        this.startPoint.x - layer.bounds.x,
        this.startPoint.y - layer.bounds.y,
        pt.x - layer.bounds.x,
        pt.y - layer.bounds.y
      );
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, layer.canvas!.width, layer.canvas!.height);
    } else if (type === 'radial') {
      const dx = pt.x - this.startPoint.x;
      const dy = pt.y - this.startPoint.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      const grad = ctx.createRadialGradient(
        this.startPoint.x - layer.bounds.x,
        this.startPoint.y - layer.bounds.y,
        0,
        this.startPoint.x - layer.bounds.x,
        this.startPoint.y - layer.bounds.y,
        r
      );
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, layer.canvas!.width, layer.canvas!.height);
    }

    ctx.restore();
    this.ctx.commitCallback('Gradient');
    super.onPointerUp(e);
  }
}
