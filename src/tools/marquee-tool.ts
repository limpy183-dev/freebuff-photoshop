import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition, Selection } from '../types';

export class MarqueeTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'marquee-rect',
    name: 'Rectangular Marquee Tool',
    group: 'selection',
    shortcut: 'm',
    cursor: 'crosshair',
    options: [
      { name: 'feather', type: 'number', default: 0, min: 0, max: 250 },
      { name: 'antiAlias', type: 'boolean', default: true },
      { name: 'style', type: 'enum', default: 'normal', choices: ['normal', 'fixed-ratio', 'fixed-size'] },
    ],
  };

  private selectionCanvas: HTMLCanvasElement | null = null;
  private selCtx: CanvasRenderingContext2D | null = null;

  activate(context: ToolContext): void {
    super.activate(context);
    this.selectionCanvas = document.createElement('canvas');
    this.selectionCanvas.width = context.document.width;
    this.selectionCanvas.height = context.document.height;
    this.selCtx = this.selectionCanvas.getContext('2d')!;
  }

  onPointerDown(e: PointerEvent): void {
    super.onPointerDown(e);
    if (!this.selCtx || !this.ctx) return;
    this.selCtx.clearRect(0, 0, this.selectionCanvas!.width, this.selectionCanvas!.height);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.selCtx || !this.ctx) return;
    const pt = this.getCanvasPoint(e);
    const x = Math.min(this.startPoint.x, pt.x);
    const y = Math.min(this.startPoint.y, pt.y);
    const w = Math.abs(pt.x - this.startPoint.x);
    const h = Math.abs(pt.y - this.startPoint.y);

    this.selCtx.clearRect(0, 0, this.selectionCanvas!.width, this.selectionCanvas!.height);
    this.selCtx.fillStyle = 'white';
    this.selCtx.fillRect(x, y, w, h);
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.isDragging || !this.selectionCanvas || !this.ctx) {
      super.onPointerUp(e);
      return;
    }
    const pt = this.getCanvasPoint(e);
    const x = Math.round(Math.min(this.startPoint.x, pt.x));
    const y = Math.round(Math.min(this.startPoint.y, pt.y));
    const w = Math.round(Math.abs(pt.x - this.startPoint.x));
    const h = Math.round(Math.abs(pt.y - this.startPoint.y));

    if (w > 0 && h > 0) {
      const mask = this.selectionCanvas.getContext('2d')!.getImageData(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);
      this.ctx.document.selection = {
        mask,
        feather: (this.getOptions().feather as number) ?? 0,
        antiAlias: (this.getOptions().antiAlias as boolean) ?? true,
      };
      this.ctx.commitCallback('Rectangular Marquee');
    }

    super.onPointerUp(e);
  }

  deactivate(): void {
    this.selectionCanvas = null;
    this.selCtx = null;
    super.deactivate();
  }
}
