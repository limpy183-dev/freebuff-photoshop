import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition, Selection } from '../types';

export class LassoTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'lasso',
    name: 'Lasso Tool',
    group: 'selection',
    shortcut: 'l',
    cursor: 'crosshair',
    options: [
      { name: 'feather', type: 'number', default: 0, min: 0, max: 250 },
      { name: 'antiAlias', type: 'boolean', default: true },
    ],
  };

  private points: Point[] = [];
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
    this.points = [this.startPoint];
    if (!this.selCtx || !this.ctx) return;
    this.selCtx.clearRect(0, 0, this.selectionCanvas!.width, this.selectionCanvas!.height);
    this.selCtx.beginPath();
    this.selCtx.moveTo(this.startPoint.x, this.startPoint.y);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.selCtx || !this.ctx || !this.selectionCanvas) return;
    const pt = this.getCanvasPoint(e);
    this.points.push(pt);
    // Clear and redraw entire path to avoid restroking
    this.selCtx.clearRect(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);
    this.selCtx.beginPath();
    this.selCtx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.selCtx.lineTo(this.points[i].x, this.points[i].y);
    }
    this.selCtx.strokeStyle = 'white';
    this.selCtx.lineWidth = 1;
    this.selCtx.setLineDash([4, 4]);
    this.selCtx.stroke();
    this.selCtx.setLineDash([]);
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.isDragging || !this.selectionCanvas || !this.ctx || this.points.length < 3) {
      super.onPointerUp(e);
      return;
    }

    this.selCtx!.closePath();
    this.selCtx!.fillStyle = 'white';
    this.selCtx!.fill();

    const mask = this.selCtx!.getImageData(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);
    this.ctx.document.selection = {
      mask,
      feather: (this.getOptions().feather as number) ?? 0,
      antiAlias: (this.getOptions().antiAlias as boolean) ?? true,
    };
    this.ctx.commitCallback('Lasso');
    super.onPointerUp(e);
  }

  deactivate(): void {
    this.selectionCanvas = null;
    this.selCtx = null;
    this.points = [];
    super.deactivate();
  }
}
