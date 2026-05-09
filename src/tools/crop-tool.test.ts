import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CropTool } from './crop-tool';
import type { AppState, Document, ViewportState, Layer } from '../types';
import type { ToolContext } from './tool-base';

function makeCropContext(overrides?: Partial<ToolContext>): ToolContext {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;

  const layer1Canvas = document.createElement('canvas');
  layer1Canvas.width = 500;
  layer1Canvas.height = 500;

  const layer1: Layer = {
    id: 'layer-1',
    name: 'Layer 1',
    type: 'pixel',
    visible: true,
    locked: false,
    opacity: 100,
    fillOpacity: 100,
    blendMode: 'normal',
    bounds: { x: 0, y: 0, width: 500, height: 500 },
    canvas: layer1Canvas,
    mask: null,
    vectorMask: null,
    effects: [],
    colorLabel: '',
  };

  const appState: AppState = {
    documents: [],
    activeDocumentId: null,
    activeToolId: 'crop',
    toolOptions: {
      crop: {
        ratio: 'free',
        deleteCropped: false,
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
    layers: [layer1],
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

describe('CropTool definition', () => {
  it('has correct tool metadata', () => {
    const tool = new CropTool();
    expect(tool.definition.id).toBe('crop');
    expect(tool.definition.name).toBe('Crop Tool');
    expect(tool.definition.group).toBe('crop');
    expect(tool.definition.shortcut).toBe('c');
    expect(tool.definition.cursor).toBe('crosshair');
  });

  it('has all expected options', () => {
    const tool = new CropTool();
    const names = tool.definition.options.map(o => o.name);
    expect(names).toContain('ratio');
    expect(names).toContain('deleteCropped');
  });

  it('has correct defaults', () => {
    const tool = new CropTool();
    const defaults = Object.fromEntries(tool.definition.options.map(o => [o.name, o.default]));
    expect(defaults.ratio).toBe('free');
    expect(defaults.deleteCropped).toBe(false);
  });

  it('ratio choices include expected values', () => {
    const tool = new CropTool();
    const ratio = tool.definition.options.find(o => o.name === 'ratio');
    expect(ratio!.choices).toContain('free');
    expect(ratio!.choices).toContain('1:1');
    expect(ratio!.choices).toContain('4:3');
    expect(ratio!.choices).toContain('16:9');
    expect(ratio!.choices).toContain('3:2');
  });
});

describe('CropTool crop rect', () => {
  let tool: CropTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new CropTool();
    ctx = makeCropContext();
    tool.activate(ctx);
  });

  it('starts crop rect on pointer down', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    expect(tool['cropRect']).toEqual({ x: 50, y: 50, width: 0, height: 0 });
  });

  it('updates crop rect on pointer move', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 150, clientY: 200 }));
    expect(tool['cropRect']).toEqual({ x: 50, y: 50, width: 100, height: 150 });
  });

  it('handles reverse drag', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 150, clientY: 200 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(tool['cropRect']).toEqual({ x: 50, y: 50, width: 100, height: 150 });
  });
});

describe('CropTool ratio constraints', () => {
  let tool: CropTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new CropTool();
    ctx = makeCropContext();
    tool.activate(ctx);
  });

  it('enforces 1:1 ratio', () => {
    ctx.appState.toolOptions.crop!.ratio = '1:1';
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 200 }));
    const rect = tool['cropRect']!;
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(100);
  });

  it('enforces 4:3 ratio when wider', () => {
    ctx.appState.toolOptions.crop!.ratio = '4:3';
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 200, clientY: 100 }));
    const rect = tool['cropRect']!;
    expect(Math.abs(rect.width / rect.height - 4 / 3)).toBeLessThan(0.01);
  });

  it('enforces 16:9 ratio when taller', () => {
    ctx.appState.toolOptions.crop!.ratio = '16:9';
    tool.activate(ctx);
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 200 }));
    const rect = tool['cropRect']!;
    expect(Math.abs(rect.width / rect.height - 16 / 9)).toBeLessThan(0.01);
  });

  it('does not constrain when free', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 100, clientY: 200 }));
    const rect = tool['cropRect']!;
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(200);
  });
});

describe('CropTool apply crop', () => {
  let tool: CropTool;
  let ctx: ToolContext;

  beforeEach(() => {
    tool = new CropTool();
    ctx = makeCropContext();
    tool.activate(ctx);
  });

  it('applies crop to document dimensions', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 150, clientY: 200 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 150, clientY: 200 }));
    expect(ctx.document.width).toBe(100);
    expect(ctx.document.height).toBe(150);
    expect(ctx.commitCallback).toHaveBeenCalledWith('Crop');
  });

  it('applies crop to all layers', () => {
    const layer2Canvas = document.createElement('canvas');
    layer2Canvas.width = 500;
    layer2Canvas.height = 500;
    ctx.document.layers.push({
      id: 'layer-2',
      name: 'Layer 2',
      type: 'pixel',
      visible: true,
      locked: false,
      opacity: 100,
      fillOpacity: 100,
      blendMode: 'normal',
      bounds: { x: 0, y: 0, width: 500, height: 500 },
      canvas: layer2Canvas,
      mask: null,
      vectorMask: null,
      effects: [],
      colorLabel: '',
    });
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 150, clientY: 200 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 150, clientY: 200 }));
    expect(ctx.document.layers[0].bounds.width).toBe(100);
    expect(ctx.document.layers[0].bounds.height).toBe(150);
    expect(ctx.document.layers[1].bounds.width).toBe(100);
    expect(ctx.document.layers[1].bounds.height).toBe(150);
  });

  it('ignores too-small crop', () => {
    tool.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    tool.onPointerMove(new PointerEvent('pointermove', { clientX: 1, clientY: 1 }));
    tool.onPointerUp(new PointerEvent('pointerup', { clientX: 1, clientY: 1 }));
    expect(ctx.document.width).toBe(500);
    expect(ctx.commitCallback).not.toHaveBeenCalled();
  });
});
