import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPixelLayer,
  createGroupLayer,
  getLayerImageData,
  putLayerImageData,
  ensureLayerCanvas,
} from './layer';
import type { Layer, ColorRGB } from '../types';

describe('createPixelLayer', () => {
  it('creates a pixel layer with correct defaults', () => {
    const layer = createPixelLayer(100, 200, 'Test Layer');
    expect(layer.type).toBe('pixel');
    expect(layer.name).toBe('Test Layer');
    expect(layer.visible).toBe(true);
    expect(layer.locked).toBe(false);
    expect(layer.opacity).toBe(100);
    expect(layer.fillOpacity).toBe(100);
    expect(layer.blendMode).toBe('normal');
    expect(layer.bounds).toEqual({ x: 0, y: 0, width: 100, height: 200 });
    expect(layer.canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(layer.canvas!.width).toBe(100);
    expect(layer.canvas!.height).toBe(200);
    expect(layer.mask).toBeNull();
    expect(layer.vectorMask).toBeNull();
    expect(layer.effects).toEqual([]);
    expect(layer.colorLabel).toBe('');
  });

  it('generates unique IDs', () => {
    const layer1 = createPixelLayer(10, 10);
    const layer2 = createPixelLayer(10, 10);
    expect(layer1.id).not.toBe(layer2.id);
    expect(layer1.id).toMatch(/^layer-/);
  });

  it('fills with color when provided', () => {
    const fill: ColorRGB = { r: 255, g: 128, b: 64 };
    const layer = createPixelLayer(10, 10, 'Filled', fill);
    const ctx = layer.canvas!.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('fillRect(0,0,10,10)');
  });

  it('uses default name when not provided', () => {
    const layer = createPixelLayer(10, 10);
    expect(layer.name).toBe('Layer');
  });

  it('creates transparent layer without fill', () => {
    const layer = createPixelLayer(10, 10, 'Transparent');
    const ctx = layer.canvas!.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).not.toContain('fillRect(0,0,10,10)');
  });
});

describe('createGroupLayer', () => {
  it('creates a group layer with correct defaults', () => {
    const layer = createGroupLayer('Group 1');
    expect(layer.type).toBe('group');
    expect(layer.name).toBe('Group 1');
    expect(layer.canvas).toBeNull();
    expect(layer.children).toEqual([]);
    expect(layer.bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it('generates unique IDs', () => {
    const layer1 = createGroupLayer();
    const layer2 = createGroupLayer();
    expect(layer1.id).not.toBe(layer2.id);
    expect(layer1.id).toMatch(/^group-/);
  });

  it('uses default name when not provided', () => {
    const layer = createGroupLayer();
    expect(layer.name).toBe('Group');
  });
});

describe('getLayerImageData', () => {
  it('returns ImageData for a pixel layer', () => {
    const layer = createPixelLayer(10, 10);
    const data = getLayerImageData(layer);
    expect(data).not.toBeNull();
    expect(data!.width).toBe(10);
    expect(data!.height).toBe(10);
    expect(data!.data).toBeInstanceOf(Uint8ClampedArray);
    expect(data!.data.length).toBe(10 * 10 * 4);
  });

  it('returns null for group layer', () => {
    const layer = createGroupLayer();
    expect(getLayerImageData(layer)).toBeNull();
  });

  it('returns null when canvas is null', () => {
    const layer = createPixelLayer(10, 10);
    layer.canvas = null;
    expect(getLayerImageData(layer)).toBeNull();
  });
});

describe('putLayerImageData', () => {
  it('puts ImageData onto layer canvas', () => {
    const layer = createPixelLayer(10, 10);
    const data = new ImageData(10, 10);
    putLayerImageData(layer, data);
    const ctx = layer.canvas!.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('putImageData(0,0)');
  });

  it('does nothing when canvas is null', () => {
    const layer = createGroupLayer();
    const data = new ImageData(10, 10);
    expect(() => putLayerImageData(layer, data)).not.toThrow();
  });
});

describe('ensureLayerCanvas', () => {
  it('creates canvas when missing', () => {
    const layer = createGroupLayer();
    const canvas = ensureLayerCanvas(layer, 100, 200);
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(200);
    expect(layer.canvas).toBe(canvas);
  });

  it('resizes canvas when dimensions differ', () => {
    const layer = createPixelLayer(50, 50);
    const originalCanvas = layer.canvas;
    const canvas = ensureLayerCanvas(layer, 100, 200);
    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(200);
    expect(layer.canvas).toBe(canvas);
  });

  it('preserves existing canvas when dimensions match', () => {
    const layer = createPixelLayer(100, 200);
    const originalCanvas = layer.canvas;
    const canvas = ensureLayerCanvas(layer, 100, 200);
    expect(canvas).toBe(originalCanvas);
  });

  it('preserves old data when resizing', () => {
    const layer = createPixelLayer(10, 10);
    const canvas = ensureLayerCanvas(layer, 20, 20);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('putImageData(0,0)');
  });
});
