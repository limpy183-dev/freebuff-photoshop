import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloneStampTool } from './clone-stamp-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makeCloneContext(overrides?: Partial<ToolContext>): ToolContext {
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
    activeToolId: 'clone-stamp',
    toolOptions: {
      'clone-stamp': {
        size: 20,
        hardness: 100,
        opacity: 100,
        flow: 100,
        aligned: true,
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

describe('CloneStampTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new CloneStampTool();
    expect(tool.definition.id).toBe('clone-stamp');
    expect(tool.definition.name).toBe('Clone Stamp Tool');
    expect(tool.definition.group).toBe('retouching');
    expect(tool.definition.shortcut).toBe('s');
    expect(tool.definition.cursor).toBe('crosshair');
  });

  it('has all expected options', () => {
    const tool = new CloneStampTool();
    const names = tool.definition.options.map(o => o.name);
    expect(names).toContain('size');
    expect(names).toContain('hardness');
    expect(names).toContain('opacity');
    expect(names).toContain('flow');
    expect(names).toContain('aligned');
  });

  it('has correct defaults', () => {
    const tool = new CloneStampTool();
    const defaults = Object.fromEntries(tool.definition.options.map(o => [o.name, o.default]));
    expect(defaults.size).toBe(20);
    expect(defaults.hardness).toBe(100);
    expect(defaults.opacity).toBe(100);
    expect(defaults.flow).toBe(100);
    expect(defaults.aligned).toBe(true);
  });
});

describe('CloneStampTool source point', () => {
  let tool: CloneStampTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new CloneStampTool();
    ctx = makeCloneContext();
    tool.activate(ctx);
  });

  it('sets source point with alt+pointer down', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, altKey: true }));
    expect(tool['sourcePoint']).toEqual({ x: 100, y: 100 });
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });

  it('clones when source is set and normal click', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, altKey: true }));
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.some(c => c.includes('drawImage'))).toBe(true);
  });

  it('does not clone without source point', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.some(c => c.includes('drawImage'))).toBe(false);
  });
});

describe('CloneStampTool cloning', () => {
  let tool: CloneStampTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new CloneStampTool();
    ctx = makeCloneContext();
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, altKey: true }));
  });

  it('commits on pointer up after dragging', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 220, clientY: 220 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 220, clientY: 220 }));
    expect(ctx.commitCallback).toHaveBeenCalledTimes(1);
    expect(ctx.commitCallback).toHaveBeenCalledWith('Clone Stamp');
  });

  it('interpolates clone stroke', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 300, clientY: 300 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    const drawImageCalls = drawCalls.filter(c => c.includes('drawImage'));
    expect(drawImageCalls.length).toBeGreaterThan(1);
  });

  it('uses aligned offset', () => {
    ctx.appState.toolOptions['clone-stamp']!.aligned = true;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 220, clientY: 220 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.some(c => c.includes('drawImage'))).toBe(true);
  });

  it('uses fixed offset in non-aligned mode', () => {
    ctx.appState.toolOptions['clone-stamp']!.aligned = false;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 220, clientY: 220 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.some(c => c.includes('drawImage'))).toBe(true);
  });
});

describe('CloneStampTool no active layer', () => {
  it('does nothing without active layer', () => {
    const tool = new CloneStampTool();
    const ctx = makeCloneContext();
    ctx.document.activeLayerId = null;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, altKey: true }));
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });
});
