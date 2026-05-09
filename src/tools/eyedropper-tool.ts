import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition, ColorRGB } from '../types';

export class EyedropperTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'eyedropper',
    name: 'Eyedropper Tool',
    group: 'measurement',
    shortcut: 'i',
    cursor: 'crosshair',
    options: [
      { name: 'sampleSize', type: 'enum', default: 'point', choices: ['point', '3x3', '5x5', '11x11', '31x31'] },
      { name: 'sample', type: 'enum', default: 'current', choices: ['current', 'all'] },
    ],
  };

  onPointerDown(e: PointerEvent): void {
    if (!this.ctx) return;
    const pt = this.getCanvasPoint(e);
    const color = this.sampleColor(pt);
    if (color) {
      this.ctx.appState.foregroundColor = color;
    }
  }

  private sampleColor(pt: Point): ColorRGB | null {
    if (!this.ctx) return null;

    const doc = this.ctx.document;
    const opts = this.getOptions();
    const sampleSizeStr = (opts.sampleSize as string) ?? 'point';
    const size = sampleSizeStr === 'point' ? 1 : parseInt(sampleSizeStr.split('x')[0]);

    const composite = document.createElement('canvas');
    composite.width = doc.width;
    composite.height = doc.height;
    const ctx = composite.getContext('2d')!;

    ctx.fillStyle = `rgb(${doc.backgroundColor.r},${doc.backgroundColor.g},${doc.backgroundColor.b})`;
    ctx.fillRect(0, 0, doc.width, doc.height);

    for (const layer of doc.layers) {
      if (!layer.visible || !layer.canvas) continue;
      ctx.globalAlpha = layer.opacity / 100;
      ctx.drawImage(layer.canvas, layer.bounds.x, layer.bounds.y);
    }

    const x = Math.max(0, Math.min(doc.width - 1, Math.round(pt.x)));
    const y = Math.max(0, Math.min(doc.height - 1, Math.round(pt.y)));
    const half = Math.floor(size / 2);
    let r = 0, g = 0, b = 0, count = 0;

    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const sx = x + dx;
        const sy = y + dy;
        if (sx >= 0 && sx < doc.width && sy >= 0 && sy < doc.height) {
          const pixel = ctx.getImageData(sx, sy, 1, 1).data;
          r += pixel[0];
          g += pixel[1];
          b += pixel[2];
          count++;
        }
      }
    }

    if (count === 0) return null;
    return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
  }
}
