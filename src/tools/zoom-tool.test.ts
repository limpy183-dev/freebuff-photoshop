import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZoomTool } from './zoom-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makeZoomContext(overrides?: Partial<ToolContext>): ToolContext {
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
    activeToolId: 'zoom',
    toolOptions: {
      zoom: {
        mode: 'in',
        scrubby: true,
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

describe('ZoomTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new ZoomTool();
    expect(tool.definition.id).toBe('zoom');
    expect(tool.definition.name).toBe('Zoom Tool');
    expect(tool.definition.group).toBe('navigation');
    expect(tool.definition.shortcut).toBe('z');
    expect(tool.definition.cursor).toBe('zoom-in');
  });

  it('has all expected options', () => {
    const tool = new ZoomTool();
    const names = tool.definition.options.map(o => o.name);
    expect(names).toContain('mode');
    expect(names).toContain('scrubby');
  });

  it('has correct defaults', () => {
    const tool = new ZoomTool();
    const defaults = Object.fromEntries(tool.definition.options.map(o => [o.name, o.default]));
    expect(defaults.mode).toBe('in');
    expect(defaults.scrubby).toBe(true);
  });
});

describe('ZoomTool zoom in', () => {
  let tool: ZoomTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new ZoomTool();
    ctx = makeZoomContext();
    tool.activate(ctx);
  });

  it('zooms in on pointer down', () => {
    const initialZoom = ctx.viewport.zoom;
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(ctx.viewport.zoom).toBeGreaterThan(initialZoom);
  });

  it('updates pan to zoom toward cursor', () => {
    ctx.viewport.panX = 0;
    ctx.viewport.panY = 0;
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(ctx.viewport.panX).not.toBe(0);
    expect(ctx.viewport.panY).not.toBe(0);
  });

  it('does not zoom beyond max', () => {
    ctx.viewport.zoom = 127;
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(ctx.viewport.zoom).toBeLessThanOrEqual(128);
  });
});

describe('ZoomTool zoom out', () => {
  let tool: ZoomTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new ZoomTool();
    ctx = makeZoomContext();
    tool.activate(ctx);
  });

  it('zooms out with altKey', () => {
    const initialZoom = ctx.viewport.zoom;
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, altKey: true }));
    expect(ctx.viewport.zoom).toBeLessThan(initialZoom);
  });

  it('zooms out when mode is out', () => {
    ctx.appState.toolOptions.zoom!.mode = 'out';
    tool.activate(ctx);
    const initialZoom = ctx.viewport.zoom;
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(ctx.viewport.zoom).toBeLessThan(initialZoom);
  });

  it('does not zoom below min', () => {
    ctx.viewport.zoom = 0.02;
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, altKey: true }));
    expect(ctx.viewport.zoom).toBeGreaterThanOrEqual(0.01);
  });
});

describe('ZoomTool no commit', () => {
  it('never calls commit callback', () => {
    const tool = new ZoomTool();
    const ctx = makeZoomContext();
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });
});
