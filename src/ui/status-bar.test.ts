import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderStatusBar } from './status-bar';
import type { AppState, Document, Layer, ViewportState } from '../types';

function makeAppState(overrides?: Partial<AppState>): AppState {
  const doc: Document = {
    id: 'doc-1',
    name: 'Test',
    width: 800,
    height: 600,
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
    viewport: {
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
    },
  };

  return {
    documents: [doc],
    activeDocumentId: 'doc-1',
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
    ...overrides,
  };
}

describe('renderStatusBar', () => {
  let container: HTMLDivElement;
  let onZoomChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    onZoomChange = vi.fn();
  });

  it('renders zoom dropdown', () => {
    const appState = makeAppState();
    renderStatusBar(container, { appState, onZoomChange });
    const zoomSelect = container.querySelector('#fb-zoom-select') as HTMLSelectElement;
    expect(zoomSelect).not.toBeNull();
    expect(zoomSelect.options.length).toBeGreaterThan(0);
  });

  it('selects current zoom level', () => {
    const appState = makeAppState();
    appState.documents[0].viewport!.zoom = 2;
    renderStatusBar(container, { appState, onZoomChange });
    const zoomSelect = container.querySelector('#fb-zoom-select') as HTMLSelectElement;
    expect(zoomSelect.value).toBe('2');
  });

  it('renders document dimensions', () => {
    const appState = makeAppState();
    renderStatusBar(container, { appState, onZoomChange });
    expect(container.textContent).toContain('800 x 600 px');
  });

  it('renders color profile', () => {
    const appState = makeAppState();
    renderStatusBar(container, { appState, onZoomChange });
    expect(container.textContent).toContain('RGB/8');
  });

  it('calls onZoomChange when zoom dropdown changes', () => {
    const appState = makeAppState();
    renderStatusBar(container, { appState, onZoomChange });
    const zoomSelect = container.querySelector('#fb-zoom-select') as HTMLSelectElement;
    zoomSelect.value = '0.5';
    zoomSelect.dispatchEvent(new Event('change'));
    expect(onZoomChange).toHaveBeenCalledTimes(1);
    expect(onZoomChange).toHaveBeenCalledWith(0.5);
  });

  it('shows 100% zoom by default', () => {
    const appState = makeAppState();
    renderStatusBar(container, { appState, onZoomChange });
    const zoomSelect = container.querySelector('#fb-zoom-select') as HTMLSelectElement;
    expect(zoomSelect.value).toBe('1');
  });

  it('handles no active document', () => {
    const appState = makeAppState();
    appState.activeDocumentId = null;
    renderStatusBar(container, { appState, onZoomChange });
    expect(container.textContent).not.toContain('800 x 600');
    const zoomSelect = container.querySelector('#fb-zoom-select') as HTMLSelectElement;
    expect(zoomSelect.value).toBe('1');
  });

  it('includes zoom options from 1% to 1600%', () => {
    const appState = makeAppState();
    renderStatusBar(container, { appState, onZoomChange });
    const zoomSelect = container.querySelector('#fb-zoom-select') as HTMLSelectElement;
    const values = Array.from(zoomSelect.options).map(o => o.value);
    expect(values).toContain('0.01');
    expect(values).toContain('1');
    expect(values).toContain('16');
  });
});
