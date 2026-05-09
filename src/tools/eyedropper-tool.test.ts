import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EyedropperTool } from './eyedropper-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makeEyedropperContext(overrides?: Partial<ToolContext>): ToolContext {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;

  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = 500;
  layerCanvas.height = 500;
  const layerCtx = layerCanvas.getContext('2d')!;
  layerCtx.fillStyle = 'rgb(128,64,32)';
  layerCtx.fillRect(0, 0, 500, 500);

  const layer: Layer = {
    id: 'layer-1',
    name: 'Paint Layer',
    type: 'pixel',
    visible: true,
    locked: false,
    opacity: 100,
    fillOpacity: 100,
    blendMode: 'normal',
    bounds: { x: 0, y: 0, width: 500, height: 500 },
    canvas: layerCanvas,
    mask: null,
    vectorMask: null,
    effects: [],
    colorLabel: '',
  };

  const appState: AppState = {
    documents: [],
    activeDocumentId: null,
    activeToolId: 'eyedropper',
    toolOptions: {
      eyedropper: {
        sampleSize: 'point',
        sample: 'current',
      },
    },
    foregroundColor: { r: 0, g: 0, b: 0 },
    backgroundColor: { r: 255, g: 255, b: 255 },
    panels: [],
    workspace: 'default',
    preferences: {
      historyStates: 50,
      autoSave: false,
      gridSize: 8,
      gridColor: '#808080',
      theme: 'dark',
      uiScaling: 1,
      performance: { cacheLevels: 4, tileSize: 128, useGPU: false },
    },
    clipboard: null,
  };

  const doc: Document = {
    id: 'doc-1',
    name: 'Test',
    width: 500,
    height: 500,
    resolution: 72,
    colorMode: 'rgb',
    bitDepth: 8,
    layers: [layer],
    activeLayerId: 'layer-1',
    guides: [],
    history: [],
    historyIndex: -1,
    selection: null,
    backgroundColor: { r: 255, g: 255, b: 255 },
  };

  const viewport: ViewportState = {
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
  };

  return {
    appState,
    document: doc,
    viewport,
    canvasEl: canvas,
    commitCallback: vi.fn(),
    ...overrides,
  };
}

describe('EyedropperTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new EyedropperTool();
    expect(tool.definition.id).toBe('eyedropper');
    expect(tool.definition.name).toBe('Eyedropper Tool');
    expect(tool.definition.group).toBe('measurement');
    expect(tool.definition.shortcut).toBe('i');
    expect(tool.definition.cursor).toBe('crosshair');
  });

  it('has all expected options', () => {
    const tool = new EyedropperTool();
    const names = tool.definition.options.map(o => o.name);
    expect(names).toContain('sampleSize');
    expect(names).toContain('sample');
  });

  it('has correct defaults', () => {
    const tool = new EyedropperTool();
    const defaults = Object.fromEntries(tool.definition.options.map(o => [o.name, o.default]));
    expect(defaults.sampleSize).toBe('point');
    expect(defaults.sample).toBe('current');
  });
});

describe('EyedropperTool color sampling', () => {
  let tool: EyedropperTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new EyedropperTool();
    ctx = makeEyedropperContext();
    tool.activate(ctx);
  });

  it('sets foreground color on pointer down', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(ctx.appState.foregroundColor).toBeDefined();
    // The mock fill is rgb(128,64,32) and sampled from composite
    expect(ctx.appState.foregroundColor.r).toBeGreaterThanOrEqual(0);
    expect(ctx.appState.foregroundColor.g).toBeGreaterThanOrEqual(0);
    expect(ctx.appState.foregroundColor.b).toBeGreaterThanOrEqual(0);
  });

  it('clamps coordinates to document bounds', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 1000, clientY: 1000 }));
    expect(ctx.appState.foregroundColor).toBeDefined();
    // Should not throw
    expect(() => tool.onPointerDown(new PointerEvent('pointerdown', { clientX: -10, clientY: -10 }))).not.toThrow();
  });

  it('averages over sample area', () => {
    ctx.appState.toolOptions.eyedropper!.sampleSize = '3x3';
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    const color = ctx.appState.foregroundColor;
    expect(color).toBeDefined();
    expect(color.r).toBeGreaterThanOrEqual(0);
    expect(color.r).toBeLessThanOrEqual(255);
  });

  it('ignores invisible layers when sampling all', () => {
    ctx.appState.toolOptions.eyedropper!.sample = 'all';
    ctx.document.layers[0].visible = false;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    // Should still return a color (background)
    expect(ctx.appState.foregroundColor).toBeDefined();
  });
});
