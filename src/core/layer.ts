import type { Layer, Rect, ColorRGB } from '../types';

let layerCounter = 0;

export function createPixelLayer(
  width: number,
  height: number,
  name = 'Layer',
  fillColor?: ColorRGB
): Layer {
  layerCounter++;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (fillColor) {
    ctx.fillStyle = `rgb(${fillColor.r},${fillColor.g},${fillColor.b})`;
    ctx.fillRect(0, 0, width, height);
  }

  return {
    id: `layer-${Date.now()}-${layerCounter}`,
    name,
    type: 'pixel',
    visible: true,
    locked: false,
    opacity: 100,
    fillOpacity: 100,
    blendMode: 'normal',
    bounds: { x: 0, y: 0, width, height },
    canvas,
    mask: null,
    vectorMask: null,
    effects: [],
    colorLabel: '',
  };
}

export function createGroupLayer(name = 'Group'): Layer {
  layerCounter++;
  return {
    id: `group-${Date.now()}-${layerCounter}`,
    name,
    type: 'group',
    visible: true,
    locked: false,
    opacity: 100,
    fillOpacity: 100,
    blendMode: 'normal',
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    canvas: null,
    mask: null,
    vectorMask: null,
    effects: [],
    children: [],
    colorLabel: '',
  };
}

export function getLayerImageData(layer: Layer): ImageData | null {
  if (!layer.canvas) return null;
  const ctx = layer.canvas.getContext('2d')!;
  return ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
}

export function putLayerImageData(layer: Layer, data: ImageData): void {
  if (!layer.canvas) return;
  const ctx = layer.canvas.getContext('2d')!;
  ctx.putImageData(data, 0, 0);
}

export function ensureLayerCanvas(layer: Layer, width: number, height: number): HTMLCanvasElement {
  if (!layer.canvas) {
    layer.canvas = document.createElement('canvas');
  }
  const c = layer.canvas as HTMLCanvasElement;
  if (c.width !== width || c.height !== height) {
    const oldData = c.width > 0 && c.height > 0 ? c.getContext('2d')?.getImageData(0, 0, c.width, c.height) : null;
    c.width = width;
    c.height = height;
    if (oldData) {
      c.getContext('2d')!.putImageData(oldData, 0, 0);
    }
  }
  return c;
}
