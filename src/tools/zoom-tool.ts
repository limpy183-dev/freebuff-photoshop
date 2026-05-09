import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition } from '../types';

export class ZoomTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'zoom',
    name: 'Zoom Tool',
    group: 'navigation',
    shortcut: 'z',
    cursor: 'zoom-in',
    options: [
      { name: 'mode', type: 'enum', default: 'in', choices: ['in', 'out'] },
      { name: 'scrubby', type: 'boolean', default: true },
    ],
  };

  onPointerDown(e: PointerEvent): void {
    if (!this.ctx) return;
    const rect = this.ctx.canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const opts = this.getOptions();
    const mode = (opts.mode as string) ?? 'in';
    const delta = e.altKey || mode === 'out' ? -0.5 : 0.5;

    const newZoom = Math.max(0.01, Math.min(128, this.ctx.viewport.zoom * (1 + delta)));
    const zoomRatio = newZoom / this.ctx.viewport.zoom;
    this.ctx.viewport.zoom = newZoom;
    this.ctx.viewport.panX = x - (x - this.ctx.viewport.panX) * zoomRatio;
    this.ctx.viewport.panY = y - (y - this.ctx.viewport.panY) * zoomRatio;
  }
}
