import type { ViewportState } from '../types';
import { clamp } from '../utils';

export function createViewport(): ViewportState {
  return {
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
  };
}

export function setZoom(viewport: ViewportState, zoom: number): void {
  viewport.zoom = clamp(zoom, 0.01, 128);
}

export function setPan(viewport: ViewportState, x: number, y: number): void {
  viewport.panX = x;
  viewport.panY = y;
}

export function zoomToFit(
  viewport: ViewportState,
  docW: number,
  docH: number,
  containerW: number,
  containerH: number
): void {
  const padding = 40;
  const zoom = Math.min(
    (containerW - padding * 2) / docW,
    (containerH - padding * 2) / docH,
    1
  );
  viewport.zoom = zoom;
  viewport.panX = (containerW - docW * zoom) / 2;
  viewport.panY = (containerH - docH * zoom) / 2;
}

export function zoomTo100(viewport: ViewportState, containerW: number, docW: number): void {
  viewport.zoom = 1;
  viewport.panX = (containerW - docW) / 2;
}

export function panBy(viewport: ViewportState, dx: number, dy: number): void {
  viewport.panX += dx;
  viewport.panY += dy;
}
