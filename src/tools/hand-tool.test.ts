import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HandTool } from './hand-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makeHandContext(overrides?: Partial<ToolContext>): ToolContext {
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
    activeToolId: 'hand',
    toolOptions: {},
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

describe('HandTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new HandTool();
    expect(tool.definition.id).toBe('hand');
    expect(tool.definition.name).toBe('Hand Tool');
    expect(tool.definition.group).toBe('navigation');
    expect(tool.definition.shortcut).toBe('h');
    expect(tool.definition.cursor).toBe('grab');
  });

  it('has no options', () => {
    const tool = new HandTool();
    expect(tool.definition.options).toEqual([]);
  });
});

describe('HandTool panning', () => {
  let tool: HandTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new HandTool();
    ctx = makeHandContext();
    tool.activate(ctx);
  });

  it('stores start pan on pointer down', () => {
    ctx.viewport.panX = 100;
    ctx.viewport.panY = 200;
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    expect(tool['startPanX']).toBe(100);
    expect(tool['startPanY']).toBe(200);
    expect(tool['startMouseX']).toBe(50);
    expect(tool['startMouseY']).toBe(50);
  });

  it('pans viewport on pointer move', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 80 }));
    expect(ctx.viewport.panX).toBe(50);
    expect(ctx.viewport.panY).toBe(30);
  });

  it('accumulates pan from start', () => {
    ctx.viewport.panX = 10;
    ctx.viewport.panY = 20;
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 30, clientY: 40 }));
    expect(ctx.viewport.panX).toBe(40);
    expect(ctx.viewport.panY).toBe(60);
  });

  it('does not pan when not dragging', () => {
    ctx.viewport.panX = 0;
    ctx.viewport.panY = 0;
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 100 }));
    expect(ctx.viewport.panX).toBe(0);
    expect(ctx.viewport.panY).toBe(0);
  });
});

describe('HandTool no commit', () => {
  it('never calls commit callback', () => {
    const tool = new HandTool();
    const ctx = makeHandContext();
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 50, clientY: 50 }));
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });
});
