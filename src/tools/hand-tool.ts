import { BaseTool, type ToolContext } from './tool-base';
import type { ToolDefinition } from '../types';

export class HandTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'hand',
    name: 'Hand Tool',
    group: 'navigation',
    shortcut: 'h',
    cursor: 'grab',
    options: [],
  };

  private startPanX = 0;
  private startPanY = 0;

  private startMouseX = 0;
  private startMouseY = 0;

  onPointerDown(e: PointerEvent): void {
    super.onPointerDown(e);
    if (!this.ctx) return;
    this.startPanX = this.ctx.viewport.panX;
    this.startPanY = this.ctx.viewport.panY;
    this.startMouseX = e.clientX;
    this.startMouseY = e.clientY;
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.ctx) return;
    const dx = e.clientX - this.startMouseX;
    const dy = e.clientY - this.startMouseY;
    this.ctx.viewport.panX = this.startPanX + dx;
    this.ctx.viewport.panY = this.startPanY + dy;
  }

  onPointerUp(e: PointerEvent): void {
    super.onPointerUp(e);
  }
}
