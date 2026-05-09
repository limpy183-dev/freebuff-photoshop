import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseTool, type ToolContext } from './tool-base';
import type { AppState, Document, ViewportState } from '../types';

class TestTool extends BaseTool {
  readonly definition = {
    id: 'test',
    name: 'Test Tool',
    group: 'test',
    shortcut: 't',
    cursor: 'default',
    options: [
      { name: 'size', type: 'range' as const, default: 10, min: 1, max: 100 },
      { name: 'mode', type: 'enum' as const, default: 'normal', choices: ['normal', 'multiply'] },
    ],
  };

  public exposedCtx() { return this.ctx; }
  public exposedIsDragging() { return this.isDragging; }
  public exposedStartPoint() { return this.startPoint; }
  public exposedLastPoint() { return this.lastPoint; }
}

function makeContext(overrides?: Partial<ToolContext>): ToolContext {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;

  const appState: AppState = {
    documents: [],
    activeDocumentId: null,
    activeToolId: 'test',
    toolOptions: {
      test: { size: 25, mode: 'multiply' },
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
    layers: [],
    activeLayerId: null,
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

describe('BaseTool activation', () => {
  it('stores context on activate', () => {
    const tool = new TestTool();
    const ctx = makeContext();
    tool.activate(ctx);
    expect(tool.exposedCtx()).toBe(ctx);
  });

  it('clears context on deactivate', () => {
    const tool = new TestTool();
    const ctx = makeContext();
    tool.activate(ctx);
    tool.deactivate();
    expect(tool.exposedCtx()).toBeNull();
  });

  it('resets isDragging on deactivate', () => {
    const tool = new TestTool();
    tool.activate(makeContext());
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    expect(tool.exposedIsDragging()).toBe(true);
    tool.deactivate();
    expect(tool.exposedIsDragging()).toBe(false);
  });
});

describe('BaseTool pointer events', () => {
  let tool: TestTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new TestTool();
    ctx = makeContext();
    tool.activate(ctx);
  });

  it('sets isDragging on pointer down', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    expect(tool.exposedIsDragging()).toBe(true);
  });

  it('records start point on pointer down', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 200 }));
    expect(tool.exposedStartPoint()).toEqual({ x: 100, y: 200 });
  });

  it('updates last point on pointer move while dragging', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(tool.exposedLastPoint()).toEqual({ x: 50, y: 50 });
  });

  it('does not update last point when not dragging', () => {
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(tool.exposedLastPoint()).toEqual({ x: 0, y: 0 });
  });

  it('resets isDragging on pointer up', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 10, clientY: 10 }));
    expect(tool.exposedIsDragging()).toBe(false);
  });

  it('records final point on pointer up', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 30, clientY: 40 }));
    expect(tool.exposedLastPoint()).toEqual({ x: 30, y: 40 });
  });

  it('applies zoom to canvas coordinates', () => {
    ctx.viewport.zoom = 2;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    // canvas rect is mocked to 0,0,100,100. pan=0.
    // x = (100 - 0 - 0) / 2 = 50
    expect(tool.exposedStartPoint()).toEqual({ x: 50, y: 50 });
  });

  it('applies pan offset to canvas coordinates', () => {
    ctx.viewport.panX = 25;
    ctx.viewport.panY = 35;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    // x = (100 - 0 - 25) / 1 = 75
    expect(tool.exposedStartPoint()).toEqual({ x: 75, y: 65 });
  });

  it('combines zoom and pan', () => {
    ctx.viewport.zoom = 2;
    ctx.viewport.panX = 20;
    ctx.viewport.panY = 30;
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 120, clientY: 130 }));
    // x = (120 - 0 - 20) / 2 = 50
    expect(tool.exposedStartPoint()).toEqual({ x: 50, y: 50 });
  });
});

describe('BaseTool options management', () => {
  let tool: TestTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new TestTool();
    ctx = makeContext();
    tool.activate(ctx);
  });

  it('returns current options', () => {
    const opts = tool.getOptions();
    expect(opts.size).toBe(25);
    expect(opts.mode).toBe('multiply');
  });

  it('returns empty object when not activated', () => {
    tool.deactivate();
    expect(tool.getOptions()).toEqual({});
  });

  it('sets option value', () => {
    tool.setOption('size', 50);
    const opts = tool.getOptions();
    expect(opts.size).toBe(50);
  });

  it('creates option object if missing', () => {
    ctx.appState.toolOptions = {};
    tool.activate(ctx);
    tool.setOption('size', 42);
    expect(tool.getOptions().size).toBe(42);
  });

  it('does not throw when setting option without context', () => {
    tool.deactivate();
    expect(() => tool.setOption('size', 10)).not.toThrow();
  });
});

describe('BaseTool key events', () => {
  it('has empty default key handlers', () => {
    const tool = new TestTool();
    tool.activate(makeContext());
    expect(() => tool.onKeyDown(new KeyboardEvent('keydown', { key: 'a' }))).not.toThrow();
    expect(() => tool.onKeyUp(new KeyboardEvent('keyup', { key: 'a' }))).not.toThrow();
  });
});

describe('BaseTool getPixelContext', () => {
  it('returns null when no active layer', () => {
    const tool = new TestTool();
    const ctx = makeContext();
    ctx.document.activeLayerId = null;
    tool.activate(ctx);
    expect(tool['getPixelContext']()).toBeNull();
  });

  it('returns null for missing layer', () => {
    const tool = new TestTool();
    const ctx = makeContext();
    ctx.document.activeLayerId = 'nonexistent';
    tool.activate(ctx);
    expect(tool['getPixelContext']()).toBeNull();
  });

  it('returns 2d context for pixel layer', () => {
    const tool = new TestTool();
    const ctx = makeContext();
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    ctx.document.layers = [
      {
        id: 'layer-1',
        name: 'Test',
        type: 'pixel',
        visible: true,
        locked: false,
        opacity: 100,
        fillOpacity: 100,
        blendMode: 'normal',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        canvas,
        mask: null,
        vectorMask: null,
        effects: [],
        colorLabel: '',
      },
    ];
    ctx.document.activeLayerId = 'layer-1';
    tool.activate(ctx);
    const pixelCtx = tool['getPixelContext']();
    expect(pixelCtx).not.toBeNull();
  });

  it('returns null for OffscreenCanvas layer', () => {
    const tool = new TestTool();
    const ctx = makeContext();
    ctx.document.layers = [
      {
        id: 'layer-1',
        name: 'Test',
        type: 'pixel',
        visible: true,
        locked: false,
        opacity: 100,
        fillOpacity: 100,
        blendMode: 'normal',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        canvas: new OffscreenCanvas(100, 100),
        mask: null,
        vectorMask: null,
        effects: [],
        colorLabel: '',
      },
    ];
    ctx.document.activeLayerId = 'layer-1';
    tool.activate(ctx);
    expect(tool['getPixelContext']()).toBeNull();
  });
});
