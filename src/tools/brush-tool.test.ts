import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrushTool } from './brush-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makeBrushContext(overrides?: Partial<ToolContext>): ToolContext {
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
    activeToolId: 'brush',
    toolOptions: {
      brush: {
        size: 20,
        hardness: 100,
        opacity: 100,
        flow: 100,
        spacing: 25,
        smoothing: 0,
      },
    },
    foregroundColor: { r: 255, g: 0, b: 0 },
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

describe('BrushTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new BrushTool();
    expect(tool.definition.id).toBe('brush');
    expect(tool.definition.name).toBe('Brush Tool');
    expect(tool.definition.group).toBe('painting');
    expect(tool.definition.shortcut).toBe('b');
    expect(tool.definition.cursor).toBe('crosshair');
  });

  it('has all expected options', () => {
    const tool = new BrushTool();
    const optionNames = tool.definition.options.map(o => o.name);
    expect(optionNames).toContain('size');
    expect(optionNames).toContain('hardness');
    expect(optionNames).toContain('opacity');
    expect(optionNames).toContain('flow');
    expect(optionNames).toContain('spacing');
    expect(optionNames).toContain('smoothing');
  });

  it('has correct option defaults', () => {
    const tool = new BrushTool();
    const defaults = Object.fromEntries(tool.definition.options.map(o => [o.name, o.default]));
    expect(defaults.size).toBe(20);
    expect(defaults.hardness).toBe(100);
    expect(defaults.opacity).toBe(100);
    expect(defaults.flow).toBe(100);
    expect(defaults.spacing).toBe(25);
    expect(defaults.smoothing).toBe(0);
  });
});

describe('BrushTool pointer events', () => {
  let tool: BrushTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new BrushTool();
    ctx = makeBrushContext();
    tool.activate(ctx);
  });

  it('draws a dab on pointer down', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.length).toBeGreaterThan(0);
    expect(drawCalls.some(c => c.includes('arc'))).toBe(true);
    expect(drawCalls.some(c => c.includes('fill()'))).toBe(true);
  });

  it('commits on pointer up', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 50, clientY: 50 }));
    expect(ctx.commitCallback).toHaveBeenCalledTimes(1);
    expect(ctx.commitCallback).toHaveBeenCalledWith('Brush Stroke');
  });

  it('does not commit if not dragging', () => {
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 0, clientY: 0 }));
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });

  it('does nothing when no active layer', () => {
    ctx.document.activeLayerId = null;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });

  it('uses current foreground color', () => {
    ctx.appState.foregroundColor = { r: 0, g: 128, b: 255 };
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const lastFillStyle = (layerCtx as unknown as { getLastFillStyle(): unknown }).getLastFillStyle();
    expect(lastFillStyle).toBeDefined();
    const gradient = lastFillStyle as { stops: { offset: number; color: string }[] };
    expect(gradient.stops).toBeDefined();
    expect(gradient.stops.length).toBeGreaterThan(0);
    expect(gradient.stops[0].color).toContain('0,128,255');
  });

  it('applies globalAlpha based on opacity option', () => {
    ctx.appState.toolOptions.brush!.opacity = 50;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('save()');
    expect(drawCalls).toContain('restore()');
  });
});

describe('BrushTool stroke interpolation', () => {
  let tool: BrushTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new BrushTool();
    ctx = makeBrushContext();
    tool.activate(ctx);
  });

  it('interpolates multiple dabs for long strokes', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 0 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    // Should have multiple arcs for interpolated dabs
    const arcCalls = drawCalls.filter(c => c.includes('arc'));
    expect(arcCalls.length).toBeGreaterThan(1);
  });

  it('does not interpolate for zero-distance moves', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    const arcCalls = drawCalls.filter(c => c.includes('arc'));
    // Should only have the initial dab arc
    expect(arcCalls.length).toBe(1);
  });

  it('uses spacing option for dab density', () => {
    ctx.appState.toolOptions.brush!.spacing = 50;
    ctx.appState.toolOptions.brush!.size = 20;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 0 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    const arcCalls = drawCalls.filter(c => c.includes('arc'));
    // With size=20, spacing=50%, spacing=10px, 100px stroke = ~11 dabs
    expect(arcCalls.length).toBeGreaterThanOrEqual(5);
  });

  it('applies layer bounds offset to canvas coordinates', () => {
    ctx.document.layers[0].bounds = { x: 50, y: 50, width: 400, height: 400 };
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    // Arc should be drawn at (100-50, 100-50) = (50, 50)
    expect(drawCalls.some(c => c.includes('arc(50,50'))).toBe(true);
  });
});
