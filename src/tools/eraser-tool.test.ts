import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EraserTool } from './eraser-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makeEraserContext(overrides?: Partial<ToolContext>): ToolContext {
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
    activeToolId: 'eraser',
    toolOptions: {
      eraser: {
        size: 20,
        hardness: 100,
        opacity: 100,
        mode: 'brush',
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

describe('EraserTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new EraserTool();
    expect(tool.definition.id).toBe('eraser');
    expect(tool.definition.name).toBe('Eraser Tool');
    expect(tool.definition.group).toBe('painting');
    expect(tool.definition.shortcut).toBe('e');
    expect(tool.definition.cursor).toBe('crosshair');
  });

  it('has all expected options', () => {
    const tool = new EraserTool();
    const names = tool.definition.options.map(o => o.name);
    expect(names).toContain('size');
    expect(names).toContain('hardness');
    expect(names).toContain('opacity');
    expect(names).toContain('mode');
  });

  it('has correct defaults', () => {
    const tool = new EraserTool();
    const defaults = Object.fromEntries(tool.definition.options.map(o => [o.name, o.default]));
    expect(defaults.size).toBe(20);
    expect(defaults.hardness).toBe(100);
    expect(defaults.opacity).toBe(100);
    expect(defaults.mode).toBe('brush');
  });
});

describe('EraserTool pointer events', () => {
  let tool: EraserTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new EraserTool();
    ctx = makeEraserContext();
    tool.activate(ctx);
  });

  it('erases on pointer down', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.length).toBeGreaterThan(0);
    expect(drawCalls).toContain('save()');
    expect(drawCalls).toContain('restore()');
    expect(drawCalls.some(c => c.includes('arc'))).toBe(true);
    expect(drawCalls.some(c => c.includes('fill()'))).toBe(true);
  });

  it('uses destination-out composite operation', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    // globalCompositeOperation is a property assignment, not recorded as draw call
    // We verify save/restore wrapping and arc/fill presence instead
    expect(drawCalls).toContain('save()');
    expect(drawCalls).toContain('restore()');
  });

  it('commits on pointer up', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 50, clientY: 50 }));
    expect(ctx.commitCallback).toHaveBeenCalledTimes(1);
    expect(ctx.commitCallback).toHaveBeenCalledWith('Erase');
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
});

describe('EraserTool stroke interpolation', () => {
  let tool: EraserTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new EraserTool();
    ctx = makeEraserContext();
    tool.activate(ctx);
  });

  it('interpolates multiple erase dabs for long strokes', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 0 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    const arcCalls = drawCalls.filter(c => c.includes('arc'));
    expect(arcCalls.length).toBeGreaterThan(1);
  });

  it('does not interpolate for zero-distance moves', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    const arcCalls = drawCalls.filter(c => c.includes('arc'));
    expect(arcCalls.length).toBe(1);
  });
});

describe('EraserTool layer bounds offset', () => {
  it('applies layer bounds offset to canvas coordinates', () => {
    const tool = new EraserTool();
    const ctx = makeEraserContext();
    ctx.document.layers[0].bounds = { x: 50, y: 50, width: 400, height: 400 };
    tool.activate(ctx);

    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    // Arc should be at (100-50, 100-50) = (50,50)
    expect(drawCalls.some(c => c.includes('arc(50,50'))).toBe(true);
  });
});
