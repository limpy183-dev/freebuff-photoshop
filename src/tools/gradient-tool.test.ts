import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GradientTool } from './gradient-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makeGradientContext(overrides?: Partial<ToolContext>): ToolContext {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;

  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = 500;
  layerCanvas.height = 500;

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
    activeToolId: 'gradient',
    toolOptions: {
      gradient: {
        type: 'linear',
        mode: 'normal',
        opacity: 100,
        reverse: false,
        dither: true,
      },
    },
    foregroundColor: { r: 255, g: 0, b: 0 },
    backgroundColor: { r: 0, g: 0, b: 255 },
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

describe('GradientTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new GradientTool();
    expect(tool.definition.id).toBe('gradient');
    expect(tool.definition.name).toBe('Gradient Tool');
    expect(tool.definition.group).toBe('painting');
    expect(tool.definition.shortcut).toBe('g');
    expect(tool.definition.cursor).toBe('crosshair');
  });

  it('has all expected options', () => {
    const tool = new GradientTool();
    const names = tool.definition.options.map(o => o.name);
    expect(names).toContain('type');
    expect(names).toContain('mode');
    expect(names).toContain('opacity');
    expect(names).toContain('reverse');
    expect(names).toContain('dither');
  });

  it('has correct defaults', () => {
    const tool = new GradientTool();
    const defaults = Object.fromEntries(tool.definition.options.map(o => [o.name, o.default]));
    expect(defaults.type).toBe('linear');
    expect(defaults.mode).toBe('normal');
    expect(defaults.opacity).toBe(100);
    expect(defaults.reverse).toBe(false);
    expect(defaults.dither).toBe(true);
  });
});

describe('GradientTool linear gradient', () => {
  let tool: GradientTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new GradientTool();
    ctx = makeGradientContext();
    tool.activate(ctx);
  });

  it('draws linear gradient on pointer up', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 100, clientY: 100 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.some(c => c.startsWith('fillRect'))).toBe(true);
    expect(ctx.commitCallback).toHaveBeenCalledWith('Gradient');
  });

  it('uses foreground to background colors', () => {
    ctx.appState.foregroundColor = { r: 255, g: 128, b: 0 };
    ctx.appState.backgroundColor = { r: 0, g: 255, b: 128 };
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 100, clientY: 0 }));
    // The gradient colors are embedded in fillStyle which is a mock gradient object
    // We verify the fillRect call happened
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.some(c => c.startsWith('fillRect'))).toBe(true);
  });

  it('applies layer bounds offset', () => {
    ctx.document.layers[0].bounds = { x: 50, y: 50, width: 400, height: 400 };
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 200, clientY: 200 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    // Gradient should fill the layer canvas, not document
    expect(drawCalls.some(c => c.startsWith('fillRect(0,0'))).toBe(true);
  });
});

describe('GradientTool radial gradient', () => {
  let tool: GradientTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new GradientTool();
    ctx = makeGradientContext();
    ctx.appState.toolOptions.gradient!.type = 'radial';
    tool.activate(ctx);
  });

  it('draws radial gradient on pointer up', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 200, clientY: 200 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.some(c => c.startsWith('fillRect'))).toBe(true);
    expect(ctx.commitCallback).toHaveBeenCalledWith('Gradient');
  });
});

describe('GradientTool reverse', () => {
  it('swaps foreground and background when reverse is true', () => {
    const tool = new GradientTool();
    const ctx = makeGradientContext();
    ctx.appState.toolOptions.gradient!.reverse = true;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 100, clientY: 0 }));
    // Reverse swaps colors; we verify it doesn't crash and commits
    expect(ctx.commitCallback).toHaveBeenCalledWith('Gradient');
  });
});

describe('GradientTool no active layer', () => {
  it('does nothing without active layer', () => {
    const tool = new GradientTool();
    const ctx = makeGradientContext();
    ctx.document.activeLayerId = null;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 100, clientY: 100 }));
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });
});
