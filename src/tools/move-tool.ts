import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition, Layer } from '../types';

export class MoveTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'move',
    name: 'Move Tool',
    group: 'navigation',
    shortcut: 'v',
    cursor: 'move',
    options: [],
  };

  private dragLayer: Layer | null = null;
  private dragStartBounds = { x: 0, y: 0 };

  activate(context: ToolContext): void {
    super.activate(context);
  }

  onPointerDown(e: PointerEvent): void {
    super.onPointerDown(e);
    if (!this.ctx) return;
    const layer = this.ctx.document.layers.find(l => l.id === this.ctx!.document.activeLayerId);
    if (layer && !layer.locked) {
      this.dragLayer = layer;
      this.dragStartBounds = { x: layer.bounds.x, y: layer.bounds.y };
    }
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.dragLayer || !this.ctx) return;
    const pt = this.getCanvasPoint(e);
    const dx = pt.x - this.startPoint.x;
    const dy = pt.y - this.startPoint.y;
    this.dragLayer.bounds.x = this.dragStartBounds.x + dx;
    this.dragLayer.bounds.y = this.dragStartBounds.y + dy;
  }

  onPointerUp(e: PointerEvent): void {
    if (this.isDragging && this.dragLayer) {
      this.ctx?.commitCallback('Move');
    }
    this.dragLayer = null;
    super.onPointerUp(e);
  }
}
