import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderCanvas, renderSelectionOverlay } from './canvas-renderer';
import type { Document, AppState, Layer, ViewportState } from '../types';

function makeDoc(overrides?: Partial<Document>): Document {
  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = 100;
  layerCanvas.height = 100;

  const layer: Layer = {
    id: 'layer-1',
    name: 'Layer 1',
    type: 'pixel',
    visible: true,
    locked: false,
    opacity: 100,
    fillOpacity: 100,
    blendMode: 'normal',
    bounds: { x: 0, y: 0, width: 100, height: 100 },
    canvas: layerCanvas,
    mask: null,
    vectorMask: null,
    effects: [],
    colorLabel: '',
  };

  return {
    id: 'doc-1',
    name: 'Test',
    width: 100,
    height: 100,
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
    viewport: {
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
    },
    ...overrides,
  };
}

function makeAppState(): AppState {
  return {
    documents: [],
    activeDocumentId: null,
    activeToolId: 'move',
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
}

describe('renderCanvas', () => {
  let canvas: HTMLCanvasElement;
  let doc: Document;
  let appState: AppState;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    Object.defineProperty(canvas, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 200, configurable: true });
    doc = makeDoc();
    appState = makeAppState();
  });

  it('clears canvas and draws pasteboard background', () => {
    renderCanvas(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('clearRect(0,0,200,200)');
    expect(drawCalls).toContain('fillRect(0,0,200,200)');
  });

  it('draws checkerboard pattern for transparency', () => {
    renderCanvas(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    // Pattern creation and fill
    expect(drawCalls.some(c => c.includes('translate'))).toBe(true);
    expect(drawCalls.some(c => c.includes('fillRect'))).toBe(true);
  });

  it('draws document background color', () => {
    renderCanvas(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    // Background fillRect after checkerboard
    expect(drawCalls.filter(c => c.includes('fillRect')).length).toBeGreaterThanOrEqual(2);
  });

  it('draws visible layers', () => {
    renderCanvas(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.some(c => c.includes('drawImage'))).toBe(true);
    expect(drawCalls).toContain('save()');
    expect(drawCalls).toContain('restore()');
  });

  it('skips invisible layers', () => {
    doc.layers[0].visible = false;
    renderCanvas(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.some(c => c.includes('drawImage'))).toBe(false);
  });

  it('applies viewport zoom and pan', () => {
    doc.viewport!.zoom = 2;
    doc.viewport!.panX = 10;
    doc.viewport!.panY = 20;
    renderCanvas(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    // drawImage should be called with translated coordinates
    expect(drawCalls.some(c => c.includes('drawImage'))).toBe(true);
  });

  it('applies layer blend mode', () => {
    doc.layers[0].blendMode = 'multiply';
    renderCanvas(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const mockCtx = ctx as unknown as { globalCompositeOperation: string; drawCalls: string[] };
    expect(mockCtx.globalCompositeOperation).toBe('multiply');
  });

  it('draws document border', () => {
    renderCanvas(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('strokeRect(0,0,100,100)');
  });

  it('handles empty layers array', () => {
    doc.layers = [];
    expect(() => renderCanvas(canvas, doc, appState)).not.toThrow();
  });

  it('applies DPR scaling', () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
    renderCanvas(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('setTransform(2,0,0,2,0,0)');
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });
  });
});

describe('renderSelectionOverlay', () => {
  let canvas: HTMLCanvasElement;
  let doc: Document;
  let appState: AppState;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    Object.defineProperty(canvas, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 200, configurable: true });
    doc = makeDoc();
    appState = makeAppState();
  });

  it('clears overlay canvas', () => {
    renderSelectionOverlay(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('clearRect(0,0,200,200)');
  });

  it('does not draw when no selection', () => {
    doc.selection = null;
    renderSelectionOverlay(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls.some(c => c.includes('strokeRect'))).toBe(false);
    expect(drawCalls.some(c => c.includes('setLineDash'))).toBe(false);
  });

  it('draws marching ants when selection exists', () => {
    doc.selection = {
      mask: new ImageData(100, 100),
      feather: 0,
      antiAlias: true,
    };
    vi.spyOn(Date, 'now').mockReturnValue(0);
    renderSelectionOverlay(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    expect(drawCalls).toContain('setLineDash([4,4])');
    expect(drawCalls.some(c => c.includes('strokeRect'))).toBe(true);
  });

  it('applies viewport zoom to selection border', () => {
    doc.selection = {
      mask: new ImageData(100, 100),
      feather: 0,
      antiAlias: true,
    };
    doc.viewport!.zoom = 2;
    vi.spyOn(Date, 'now').mockReturnValue(0);
    renderSelectionOverlay(canvas, doc, appState);
    const ctx = canvas.getContext('2d')!;
    const drawCalls = (ctx as unknown as { drawCalls: string[] }).drawCalls;
    // Should stroke rect at 0,0 with size 200 (100 * zoom 2)
    expect(drawCalls.some(c => c.includes('strokeRect(0,0,200,200)'))).toBe(true);
  });
});
