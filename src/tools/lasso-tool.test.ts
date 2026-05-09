import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LassoTool } from './lasso-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makeLassoContext(overrides?: Partial<ToolContext>): ToolContext {
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
    activeToolId: 'lasso',
    toolOptions: {
      lasso: {
        feather: 0,
        antiAlias: true,
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

describe('LassoTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new LassoTool();
    expect(tool.definition.id).toBe('lasso');
    expect(tool.definition.name).toBe('Lasso Tool');
    expect(tool.definition.group).toBe('selection');
    expect(tool.definition.shortcut).toBe('l');
    expect(tool.definition.cursor).toBe('crosshair');
  });

  it('has feather option', () => {
    const tool = new LassoTool();
    const feather = tool.definition.options.find(o => o.name === 'feather');
    expect(feather).toBeDefined();
    expect(feather!.type).toBe('number');
    expect(feather!.default).toBe(0);
  });

  it('has antiAlias option', () => {
    const tool = new LassoTool();
    const antiAlias = tool.definition.options.find(o => o.name === 'antiAlias');
    expect(antiAlias).toBeDefined();
    expect(antiAlias!.type).toBe('boolean');
    expect(antiAlias!.default).toBe(true);
  });
});

describe('LassoTool selection canvas lifecycle', () => {
  it('creates selection canvas on activate', () => {
    const tool = new LassoTool();
    const ctx = makeLassoContext();
    tool.activate(ctx);
    expect(tool['selectionCanvas']).toBeInstanceOf(HTMLCanvasElement);
    expect(tool['selectionCanvas']!.width).toBe(500);
    expect(tool['selectionCanvas']!.height).toBe(500);
  });

  it('clears selection canvas on deactivate', () => {
    const tool = new LassoTool();
    const ctx = makeLassoContext();
    tool.activate(ctx);
    tool.deactivate();
    expect(tool['selectionCanvas']).toBeNull();
    expect(tool['selCtx']).toBeNull();
    expect(tool['points']).toEqual([]);
  });
});

describe('LassoTool pointer events', () => {
  let tool: LassoTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new LassoTool();
    ctx = makeLassoContext();
    tool.activate(ctx);
  });

  it('clears and starts path on pointer down', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    const selCtx = tool['selCtx']!;
    const drawCalls = (selCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('clearRect(0,0,500,500)');
    expect(drawCalls).toContain('beginPath()');
    expect(drawCalls).toContain('moveTo(50,50)');
  });

  it('clears and redraws full path on pointer move', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 100 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 150, clientY: 50 }));
    const selCtx = tool['selCtx']!;
    const drawCalls = (selCtx as unknown as { drawCalls: string[] }).drawCalls;
    // Should have multiple clearRect calls and lineTo for each point
    expect(drawCalls.filter(c => c.includes('clearRect')).length).toBeGreaterThanOrEqual(1);
    expect(drawCalls).toContain('lineTo(100,100)');
    expect(drawCalls).toContain('lineTo(150,50)');
    expect(drawCalls).toContain('setLineDash([4,4])');
    expect(drawCalls).toContain('stroke()');
  });

  it('creates selection mask on pointer up', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 100 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 150, clientY: 50 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 150, clientY: 50 }));
    expect(ctx.document.selection).not.toBeNull();
    expect(ctx.document.selection!.mask.width).toBe(500);
    expect(ctx.document.selection!.mask.height).toBe(500);
    expect(ctx.commitCallback).toHaveBeenCalledWith('Lasso');
  });

  it('does not create selection with fewer than 3 points', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 50, clientY: 50 }));
    expect(ctx.document.selection).toBeNull();
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });

  it('stores feather and antiAlias from options', () => {
    ctx.appState.toolOptions.lasso!.feather = 5;
    ctx.appState.toolOptions.lasso!.antiAlias = false;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 100 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 100, clientY: 100 }));
    expect(ctx.document.selection!.feather).toBe(5);
    expect(ctx.document.selection!.antiAlias).toBe(false);
  });
});
