import type { Document, AppState } from '../types';

let checkerboardCache: { zoom: number; canvas: HTMLCanvasElement } | null = null;

function getCheckerboardPattern(zoom: number): HTMLCanvasElement {
  if (checkerboardCache && checkerboardCache.zoom === zoom) {
    return checkerboardCache.canvas;
  }

  const size = Math.max(2, Math.round(8 * zoom));
  const canvas = document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size * 2;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#444';
  ctx.fillRect(0, 0, size * 2, size * 2);
  ctx.fillStyle = '#555';
  ctx.fillRect(0, 0, size, size);
  ctx.fillRect(size, size, size, size);

  checkerboardCache = { zoom, canvas };
  return canvas;
}

export function renderCanvas(
  canvas: HTMLCanvasElement,
  doc: Document,
  appState: AppState
): void {
  const ctx = canvas.getContext('2d')!;
  const viewport = doc.viewport!;
  const dpr = window.devicePixelRatio || 1;

  // Ensure canvas backing store matches DPR
  if (canvas.width !== Math.round(canvas.clientWidth * dpr) || canvas.height !== Math.round(canvas.clientHeight * dpr)) {
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // Pasteboard background
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // Document background
  const scaledW = doc.width * viewport.zoom;
  const scaledH = doc.height * viewport.zoom;
  const drawX = viewport.panX;
  const drawY = viewport.panY;

  // Draw checkerboard pattern for transparency
  const patternCanvas = getCheckerboardPattern(viewport.zoom);
  const pattern = ctx.createPattern(patternCanvas, 'repeat')!;
  ctx.save();
  ctx.translate(drawX, drawY);
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, scaledW, scaledH);
  ctx.restore();

  // Document background color
  ctx.fillStyle = `rgb(${doc.backgroundColor.r},${doc.backgroundColor.g},${doc.backgroundColor.b})`;
  ctx.fillRect(drawX, drawY, scaledW, scaledH);

  // Render layers
  for (const layer of doc.layers) {
    if (!layer.visible || !layer.canvas) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity / 100;
    ctx.globalCompositeOperation = blendModeToComposite(layer.blendMode);
    const lx = drawX + layer.bounds.x * viewport.zoom;
    const ly = drawY + layer.bounds.y * viewport.zoom;
    const lw = layer.bounds.width * viewport.zoom;
    const lh = layer.bounds.height * viewport.zoom;
    ctx.drawImage(layer.canvas, lx, ly, lw, lh);
    ctx.restore();
  }

  // Draw document border
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(drawX, drawY, scaledW, scaledH);
}

export function renderSelectionOverlay(canvas: HTMLCanvasElement, doc: Document, appState: AppState): void {
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;

  if (canvas.width !== Math.round(canvas.clientWidth * dpr) || canvas.height !== Math.round(canvas.clientHeight * dpr)) {
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  if (!doc.selection || !doc.selection.mask) return;

  const viewport = doc.viewport!;
  const drawX = viewport.panX;
  const drawY = viewport.panY;

  // Draw marching ants selection border
  ctx.strokeStyle = 'white';
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = -Date.now() / 20;
  ctx.lineWidth = 1;

  // Simplified: draw full canvas selection for now
  ctx.strokeRect(drawX, drawY, doc.width * viewport.zoom, doc.height * viewport.zoom);
  ctx.setLineDash([]);
}

function blendModeToComposite(mode: string): GlobalCompositeOperation {
  const map: Record<string, GlobalCompositeOperation> = {
    normal: 'source-over',
    multiply: 'multiply',
    screen: 'screen',
    overlay: 'overlay',
    darken: 'darken',
    lighten: 'lighten',
    'color-dodge': 'color-dodge',
    'color-burn': 'color-burn',
    difference: 'difference',
    exclusion: 'exclusion',
    hue: 'hue',
    saturation: 'saturation',
    color: 'color',
    luminosity: 'luminosity',
  };
  return map[mode] ?? 'source-over';
}

export function setupCanvasInteraction(): void {
  // Canvas interaction is handled in app-shell.ts
}
