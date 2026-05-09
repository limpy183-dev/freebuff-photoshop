import type { Point, ToolOptions, ToolDefinition, Document, ViewportState, AppState } from '../types';

export interface ToolContext {
  appState: AppState;
  document: Document;
  viewport: ViewportState;
  canvasEl: HTMLCanvasElement;
  commitCallback: (name: string) => void;
}

export abstract class BaseTool {
  abstract readonly definition: ToolDefinition;
  protected ctx: ToolContext | null = null;
  protected isDragging = false;
  protected startPoint: Point = { x: 0, y: 0 };
  protected lastPoint: Point = { x: 0, y: 0 };

  activate(context: ToolContext): void {
    this.ctx = context;
  }

  deactivate(): void {
    this.ctx = null;
    this.isDragging = false;
  }

  onPointerDown(e: PointerEvent): void {
    this.isDragging = true;
    this.startPoint = this.getCanvasPoint(e);
    this.lastPoint = this.startPoint;
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    this.lastPoint = this.getCanvasPoint(e);
  }

  onPointerUp(e: PointerEvent): void {
    this.isDragging = false;
    this.lastPoint = this.getCanvasPoint(e);
  }

  onKeyDown(e: KeyboardEvent): void {}
  onKeyUp(e: KeyboardEvent): void {}

  getOptions(): ToolOptions {
    if (!this.ctx) return {};
    return this.ctx.appState.toolOptions[this.definition.id] ?? {};
  }

  setOption(key: string, value: number | string | boolean): void {
    if (!this.ctx) return;
    if (!this.ctx.appState.toolOptions[this.definition.id]) {
      this.ctx.appState.toolOptions[this.definition.id] = {};
    }
    this.ctx.appState.toolOptions[this.definition.id][key] = value;
  }

  protected getCanvasPoint(e: PointerEvent): Point {
    if (!this.ctx) return { x: 0, y: 0 };
    const rect = this.ctx.canvasEl.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this.ctx.viewport.panX) / this.ctx.viewport.zoom,
      y: (e.clientY - rect.top - this.ctx.viewport.panY) / this.ctx.viewport.zoom,
    };
  }

  protected getPixelContext(): CanvasRenderingContext2D | null {
    if (!this.ctx) return null;
    const layer = this.ctx.document.layers.find(l => l.id === this.ctx!.document.activeLayerId);
    if (!layer || !layer.canvas || layer.canvas instanceof OffscreenCanvas) return null;
    return layer.canvas.getContext('2d');
  }
}
