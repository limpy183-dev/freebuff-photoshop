import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarqueeTool } from './marquee-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makeMarqueeContext(overrides?: Partial<ToolContext>): ToolContext {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;

  const layer: Layer = {
    id: 'layer-1',
    name: 'Background',
    type: 'pixel',
    visible: true,
    locked: false,
    opacity: 100,
    fillOpacity: 100,
    blendMode: 'normal',
    bounds: { x: 0, y: 0, width: 500, height: 500 },
    canvas: document.createElement('canvas'),
    mask: null,
    vectorMask: null,
    effects: [],
    colorLabel: '',
  };

  const appState: AppState = {
    documents: [],
    activeDocumentId: null,
    activeToolId: 'marquee-rect',
    toolOptions: {
      'marquee-rect': {
        feather: 0,
        antiAlias: true,
        style: 'normal',
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

describe('MarqueeTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new MarqueeTool();
    expect(tool.definition.id).toBe('marquee-rect');
    expect(tool.definition.name).toBe('Rectangular Marquee Tool');
    expect(tool.definition.group).toBe('selection');
    expect(tool.definition.shortcut).toBe('m');
    expect(tool.definition.cursor).toBe('crosshair');
  });

  it('has feather option', () => {
    const tool = new MarqueeTool();
    const feather = tool.definition.options.find(o => o.name === 'feather');
    expect(feather).toBeDefined();
    expect(feather!.type).toBe('number');
    expect(feather!.default).toBe(0);
  });

  it('has antiAlias option', () => {
    const tool = new MarqueeTool();
    const antiAlias = tool.definition.options.find(o => o.name === 'antiAlias');
    expect(antiAlias).toBeDefined();
    expect(antiAlias!.type).toBe('boolean');
    expect(antiAlias!.default).toBe(true);
  });

  it('has style option', () => {
    const tool = new MarqueeTool();
    const style = tool.definition.options.find(o => o.name === 'style');
    expect(style).toBeDefined();
    expect(style!.type).toBe('enum');
    expect(style!.choices).toContain('normal');
    expect(style!.choices).toContain('fixed-ratio');
    expect(style!.choices).toContain('fixed-size');
  });
});

describe('MarqueeTool activation', () => {
  it('creates selection canvas on activate', () => {
    const tool = new MarqueeTool();
    const ctx = makeMarqueeContext();
    tool.activate(ctx);
    expect(tool['selectionCanvas']).toBeInstanceOf(HTMLCanvasElement);
    expect(tool['selectionCanvas']!.width).toBe(500);
    expect(tool['selectionCanvas']!.height).toBe(500);
  });

  it('clears selection canvas on deactivate', () => {
    const tool = new MarqueeTool();
    const ctx = makeMarqueeContext();
    tool.activate(ctx);
    tool.deactivate();
    expect(tool['selectionCanvas']).toBeNull();
    expect(tool['selCtx']).toBeNull();
  });
});

describe('MarqueeTool selection creation', () => {
  let tool: MarqueeTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new MarqueeTool();
    ctx = makeMarqueeContext();
    tool.activate(ctx);
  });

  it('clears selection canvas on pointer down', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    const selCtx = tool['selCtx']!;
    const drawCalls = (selCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('clearRect(0,0,500,500)');
  });

  it('draws preview rect during drag', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 150, clientY: 200 }));
    const selCtx = tool['selCtx']!;
    const drawCalls = (selCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('clearRect(0,0,500,500)');
    expect(drawCalls).toContain('fillRect(50,50,100,150)');
  });

  it('handles dragging in reverse direction', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 150, clientY: 200 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    const selCtx = tool['selCtx']!;
    const drawCalls = (selCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('fillRect(50,50,100,150)');
  });

  it('creates selection on pointer up', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 150, clientY: 200 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 150, clientY: 200 }));
    expect(ctx.document.selection).not.toBeNull();
    expect(ctx.commitCallback).toHaveBeenCalledWith('Rectangular Marquee');
  });

  it('does not create selection for zero-size drag', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 50, clientY: 50 }));
    expect(ctx.document.selection).toBeNull();
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });

  it('stores correct selection dimensions', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 10, clientY: 20 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 110, clientY: 120 }));
    const sel = ctx.document.selection!;
    expect(sel.mask.width).toBe(500);
    expect(sel.mask.height).toBe(500);
    expect(sel.feather).toBe(0);
    expect(sel.antiAlias).toBe(true);
  });

  it('uses feather option value', () => {
    ctx.appState.toolOptions['marquee-rect']!.feather = 5;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 100, clientY: 100 }));
    expect(ctx.document.selection!.feather).toBe(5);
  });

  it('uses antiAlias option value', () => {
    ctx.appState.toolOptions['marquee-rect']!.antiAlias = false;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 100, clientY: 100 }));
    expect(ctx.document.selection!.antiAlias).toBe(false);
  });
});

describe('MarqueeTool options', () => {
  it('defaults feather to 0', () => {
    const tool = new MarqueeTool();
    const ctx = makeMarqueeContext();
    tool.activate(ctx);
    expect(tool.getOptions().feather).toBe(0);
  });

  it('defaults antiAlias to true', () => {
    const tool = new MarqueeTool();
    const ctx = makeMarqueeContext();
    tool.activate(ctx);
    expect(tool.getOptions().antiAlias).toBe(true);
  });
});
