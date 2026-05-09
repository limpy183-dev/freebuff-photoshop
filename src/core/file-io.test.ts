import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveAsPng, saveAsJpeg, exportAsWebP, openFile } from './file-io';
import type { Document, Layer } from '../types';

function makeDoc(overrides?: Partial<Document>): Document {
  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = 100;
  layerCanvas.height = 100;
  const ctx = layerCanvas.getContext('2d')!;
  ctx.fillStyle = 'rgb(128,128,128)';
  ctx.fillRect(0, 0, 100, 100);

  const layer: Layer = {
    id: 'layer-1',
    name: 'Background',
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
    ...overrides,
  };
}

describe('saveAsPng', () => {
  it('calls toDataURL with image/png', () => {
    const doc = makeDoc();
    const toDataURLSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
    saveAsPng(doc, 'test.png');
    expect(toDataURLSpy).toHaveBeenCalledWith('image/png');
    toDataURLSpy.mockRestore();
  });

  it('does not throw', () => {
    const doc = makeDoc();
    expect(() => saveAsPng(doc, 'test.png')).not.toThrow();
  });
});

describe('saveAsJpeg', () => {
  it('calls toDataURL with image/jpeg and quality', () => {
    const doc = makeDoc();
    const toDataURLSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
    saveAsJpeg(doc, 'test.jpg', 0.85);
    expect(toDataURLSpy).toHaveBeenCalledWith('image/jpeg', 0.85);
    toDataURLSpy.mockRestore();
  });

  it('does not throw', () => {
    const doc = makeDoc();
    expect(() => saveAsJpeg(doc, 'test.jpg')).not.toThrow();
  });
});

describe('exportAsWebP', () => {
  it('calls toBlob with image/webp and quality', () => {
    const doc = makeDoc();
    const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    exportAsWebP(doc, 'test.webp', 0.9);
    expect(toBlobSpy).toHaveBeenCalled();
    expect(toBlobSpy.mock.calls[0][1]).toBe('image/webp');
    expect(toBlobSpy.mock.calls[0][2]).toBe(0.9);
    createObjectURLSpy.mockRestore();
    toBlobSpy.mockRestore();
  });

  it('does not throw', () => {
    const doc = makeDoc();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    expect(() => exportAsWebP(doc, 'test.webp')).not.toThrow();
  });
});

describe('openFile', () => {
  it('does not throw when called', () => {
    expect(() => openFile(vi.fn())).not.toThrow();
  });
});
