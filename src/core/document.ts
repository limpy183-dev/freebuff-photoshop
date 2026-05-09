import type { Document, Layer, Rect, ColorRGB, ColorMode, BitDepth } from '../types';
import { createPixelLayer } from './layer';

let docCounter = 0;

export function createDocument(
  width: number,
  height: number,
  name = 'Untitled',
  colorMode: ColorMode = 'rgb',
  bitDepth: BitDepth = 8,
  backgroundColor: ColorRGB = { r: 255, g: 255, b: 255 }
): Document {
  docCounter++;
  const id = `doc-${Date.now()}-${docCounter}`;
  const backgroundLayer = createPixelLayer(width, height, 'Background', backgroundColor);
  backgroundLayer.locked = true;

  return {
    id,
    name,
    width,
    height,
    resolution: 72,
    colorMode,
    bitDepth,
    layers: [backgroundLayer],
    activeLayerId: backgroundLayer.id,
    guides: [],
    history: [],
    historyIndex: -1,
    selection: null,
    backgroundColor,
  };
}

export function getActiveLayer(doc: Document): Layer | null {
  return doc.layers.find(l => l.id === doc.activeLayerId) ?? null;
}

export function getLayerById(doc: Document, layerId: string): Layer | null {
  return findLayerRecursive(doc.layers, layerId);
}

function findLayerRecursive(layers: Layer[], layerId: string): Layer | null {
  for (const layer of layers) {
    if (layer.id === layerId) return layer;
    if (layer.children) {
      const found = findLayerRecursive(layer.children, layerId);
      if (found) return found;
    }
  }
  return null;
}

export function flattenLayers(doc: Document): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = doc.width;
  canvas.height = doc.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = `rgb(${doc.backgroundColor.r},${doc.backgroundColor.g},${doc.backgroundColor.b})`;
  ctx.fillRect(0, 0, doc.width, doc.height);

  for (const layer of doc.layers) {
    if (!layer.visible || !layer.canvas) continue;
    ctx.globalAlpha = layer.opacity / 100;
    ctx.globalCompositeOperation = blendModeToComposite(layer.blendMode);
    ctx.drawImage(layer.canvas, layer.bounds.x, layer.bounds.y);
  }

  return ctx.getImageData(0, 0, doc.width, doc.height);
}

function blendModeToComposite(mode: string): GlobalCompositeOperation {
  const map: Record<string, GlobalCompositeOperation> = {
    normal: 'source-over',
    dissolve: 'source-over',
    darken: 'darken',
    multiply: 'multiply',
    colorburn: 'color-burn',
    linearburn: 'color-burn',
    darkercolor: 'darken',
    lighten: 'lighten',
    screen: 'screen',
    colordodge: 'color-dodge',
    lineardodge: 'lighter',
    lightercolor: 'lighten',
    overlay: 'overlay',
    softlight: 'soft-light',
    hardlight: 'hard-light',
    vividlight: 'hard-light',
    linearlight: 'hard-light',
    pinlight: 'hard-light',
    hardmix: 'hard-light',
    difference: 'difference',
    exclusion: 'exclusion',
    subtract: 'difference',
    divide: 'difference',
    hue: 'hue',
    saturation: 'saturation',
    color: 'color',
    luminosity: 'luminosity',
  };
  return map[mode] ?? 'source-over';
}

export function addLayer(doc: Document, layer: Layer, index?: number): void {
  if (index !== undefined) {
    doc.layers.splice(index, 0, layer);
  } else {
    doc.layers.push(layer);
  }
  doc.activeLayerId = layer.id;
}

export function removeLayer(doc: Document, layerId: string): void {
  doc.layers = doc.layers.filter(l => l.id !== layerId);
  if (doc.activeLayerId === layerId) {
    doc.activeLayerId = doc.layers[0]?.id ?? null;
  }
}

export function duplicateLayer(doc: Document, layerId: string): Layer | null {
  const layer = getLayerById(doc, layerId);
  if (!layer || !layer.canvas) return null;

  const newCanvas = document.createElement('canvas');
  newCanvas.width = layer.bounds.width;
  newCanvas.height = layer.bounds.height;
  const ctx = newCanvas.getContext('2d')!;
  ctx.drawImage(layer.canvas, 0, 0);

  const newLayer: Layer = {
    ...layer,
    id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: `${layer.name} copy`,
    canvas: newCanvas,
  };

  addLayer(doc, newLayer);
  return newLayer;
}
