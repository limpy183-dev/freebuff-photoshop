import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaintBucketTool } from './paint-bucket-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makePaintBucketContext(overrides?: Partial<ToolContext>): ToolContext {
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
    activeToolId: 'paint-bucket',
    toolOptions: {
      'paint-bucket': {
        tolerance: 32,
        contiguous: true,
        antiAlias: true,
        allLayers: false,
        mode: 'fg',
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

describe('PaintBucketTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new PaintBucketTool();
    expect(tool.definition.id).toBe('paint-bucket');
    expect(tool.definition.name).toBe('Paint Bucket Tool');
    expect(tool.definition.group).toBe('painting');
    expect(tool.definition.cursor).toBe('crosshair');
  });

  it('has all expected options', () => {
    const tool = new PaintBucketTool();
    const names = tool.definition.options.map(o => o.name);
    expect(names).toContain('tolerance');
    expect(names).toContain('contiguous');
    expect(names).toContain('antiAlias');
    expect(names).toContain('allLayers');
    expect(names).toContain('mode');
  });

  it('has correct defaults', () => {
    const tool = new PaintBucketTool();
    const defaults = Object.fromEntries(tool.definition.options.map(o => [o.name, o.default]));
    expect(defaults.tolerance).toBe(32);
    expect(defaults.contiguous).toBe(true);
    expect(defaults.antiAlias).toBe(true);
    expect(defaults.allLayers).toBe(false);
    expect(defaults.mode).toBe('fg');
  });
});

describe('PaintBucketTool fill', () => {
  let tool: PaintBucketTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new PaintBucketTool();
    ctx = makePaintBucketContext();
    tool.activate(ctx);
  });

  it('fills on pointer down', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('getImageData(0,0,500,500)');
    expect(drawCalls).toContain('putImageData(0,0)');
    expect(ctx.commitCallback).toHaveBeenCalledWith('Paint Bucket');
  });

  it('does nothing when clicking outside layer bounds', () => {
    ctx.document.layers[0].bounds = { x: 50, y: 50, width: 100, height: 100 };
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });

  it('does nothing without active layer', () => {
    ctx.document.activeLayerId = null;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });

  it('fills non-contiguous across entire layer', () => {
    ctx.appState.toolOptions['paint-bucket']!.contiguous = false;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    const layerCtx = ctx.document.layers[0].canvas!.getContext('2d')!;
    const drawCalls = (layerCtx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('putImageData(0,0)');
    expect(ctx.commitCallback).toHaveBeenCalledWith('Paint Bucket');
  });

  it('uses foreground color for fill', () => {
    ctx.appState.foregroundColor = { r: 0, g: 128, b: 255 };
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(ctx.commitCallback).toHaveBeenCalledWith('Paint Bucket');
  });
});
