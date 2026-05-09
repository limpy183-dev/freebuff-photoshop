import { BaseTool, type ToolContext } from './tool-base';
import type { Point, ToolDefinition } from '../types';

export class PaintBucketTool extends BaseTool {
  readonly definition: ToolDefinition = {
    id: 'paint-bucket',
    name: 'Paint Bucket Tool',
    group: 'painting',
    shortcut: 'g',
    cursor: 'crosshair',
    options: [
      { name: 'tolerance', type: 'range', default: 32, min: 0, max: 255 },
      { name: 'contiguous', type: 'boolean', default: true },
      { name: 'antiAlias', type: 'boolean', default: true },
      { name: 'allLayers', type: 'boolean', default: false },
      { name: 'mode', type: 'enum', default: 'fg', choices: ['fg', 'pattern'] },
    ],
  };

  onPointerDown(e: PointerEvent): void {
    if (!this.ctx) return;
    const pt = this.getCanvasPoint(e);
    const ctx = this.getPixelContext();
    if (!ctx) return;

    const layer = this.ctx.document.layers.find(l => l.id === this.ctx!.document.activeLayerId);
    if (!layer || !layer.canvas) return;

    const lx = Math.round(pt.x - layer.bounds.x);
    const ly = Math.round(pt.y - layer.bounds.y);

    if (lx < 0 || ly < 0 || lx >= layer.canvas.width || ly >= layer.canvas.height) return;

    const imageData = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
    const tolerance = (this.getOptions().tolerance as number) ?? 32;
    const contiguous = (this.getOptions().contiguous as boolean) ?? true;
    const color = this.ctx.appState.foregroundColor;

    const w = layer.canvas.width;
    const h = layer.canvas.height;
    const data = imageData.data;
    const targetIdx = (ly * w + lx) * 4;
    const tr = data[targetIdx];
    const tg = data[targetIdx + 1];
    const tb = data[targetIdx + 2];
    const ta = data[targetIdx + 3];

    const matches = (idx: number) => {
      const dr = Math.abs(data[idx] - tr);
      const dg = Math.abs(data[idx + 1] - tg);
      const db = Math.abs(data[idx + 2] - tb);
      const da = Math.abs(data[idx + 3] - ta);
      return (dr + dg + db + da) / 4 <= tolerance;
    };

    const filled = new Uint8Array(w * h);

    if (contiguous) {
      // Flood fill with proper row boundary checks
      const stack = [lx + ly * w];
      while (stack.length > 0) {
        const idx = stack.pop()!;
        const x = idx % w;
        const y = Math.floor(idx / w);
        const pIdx = idx * 4;

        if (filled[idx]) continue;
        if (!matches(pIdx)) continue;

        filled[idx] = 1;
        data[pIdx] = color.r;
        data[pIdx + 1] = color.g;
        data[pIdx + 2] = color.b;
        data[pIdx + 3] = 255;

        if (x > 0) stack.push(idx - 1);
        if (x < w - 1) stack.push(idx + 1);
        if (y > 0) stack.push(idx - w);
        if (y < h - 1) stack.push(idx + w);
      }
    } else {
      // Fill all matching pixels
      for (let i = 0; i < w * h; i++) {
        if (matches(i * 4)) {
          data[i * 4] = color.r;
          data[i * 4 + 1] = color.g;
          data[i * 4 + 2] = color.b;
          data[i * 4 + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    this.ctx.commitCallback('Paint Bucket');
  }
}
