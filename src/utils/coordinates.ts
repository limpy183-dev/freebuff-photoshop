import type { Point, ViewportState } from '../types';

export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
  canvasRect: DOMRect
): Point {
  const relX = screenX - canvasRect.left;
  const relY = screenY - canvasRect.top;
  return {
    x: (relX - viewport.panX) / viewport.zoom,
    y: (relY - viewport.panY) / viewport.zoom,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: ViewportState,
  canvasRect: DOMRect
): Point {
  return {
    x: canvasRect.left + canvasX * viewport.zoom + viewport.panX,
    y: canvasRect.top + canvasY * viewport.zoom + viewport.panY,
  };
}

export function getCanvasCenter(docWidth: number, docHeight: number, containerW: number, containerH: number): { x: number; y: number; zoom: number } {
  const zoom = Math.min(containerW / docWidth, containerH / docHeight, 1);
  const x = (containerW - docWidth * zoom) / 2;
  const y = (containerH - docHeight * zoom) / 2;
  return { x, y, zoom };
}

export function constrainPan(
  panX: number,
  panY: number,
  zoom: number,
  docW: number,
  docH: number,
  containerW: number,
  containerH: number
): { x: number; y: number } {
  const scaledW = docW * zoom;
  const scaledH = docH * zoom;
  const minX = Math.min(0, containerW - scaledW);
  const minY = Math.min(0, containerH - scaledH);
  const maxX = Math.max(0, containerW - scaledW);
  const maxY = Math.max(0, containerH - scaledH);
  return {
    x: Math.max(minX, Math.min(maxX, panX)),
    y: Math.max(minY, Math.min(maxY, panY)),
  };
}

export function zoomAtPoint(
  currentZoom: number,
  delta: number,
  pointX: number,
  pointY: number,
  currentPanX: number,
  currentPanY: number
): { zoom: number; panX: number; panY: number } {
  const newZoom = Math.max(0.01, Math.min(128, currentZoom * (1 + delta)));
  const zoomRatio = newZoom / currentZoom;
  return {
    zoom: newZoom,
    panX: pointX - (pointX - currentPanX) * zoomRatio,
    panY: pointY - (pointY - currentPanY) * zoomRatio,
  };
}
