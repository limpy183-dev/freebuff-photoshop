import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderPanels } from './panels';
import type { AppState, Document, Layer, ViewportState } from '../types';

function makeAppState(overrides?: Partial<AppState>): AppState {
  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = 100;
  layerCanvas.height = 100;

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

  const doc: Document = {
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
  };

  return {
    documents: [doc],
    activeDocumentId: 'doc-1',
    activeToolId: 'move',
    toolOptions: {},
    foregroundColor: { r: 0, g: 0, b: 0 },
    backgroundColor: { r: 255, g: 255, b: 255 },
    panels: [
      { id: 'layers', visible: true, docked: true, x: 0, y: 0, width: 250, height: 400 },
      { id: 'properties', visible: true, docked: true, x: 0, y: 0, width: 250, height: 300 },
      { id: 'navigator', visible: false, docked: true, x: 0, y: 0, width: 250, height: 200 },
      { id: 'history', visible: false, docked: true, x: 0, y: 0, width: 250, height: 300 },
    ],
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

describe('renderPanels', () => {
  let container: HTMLDivElement;
  let callbacks: {
    appState: AppState;
    onTogglePanel: ReturnType<typeof vi.fn>;
    onLayerSelect: ReturnType<typeof vi.fn>;
    onLayerVisibilityToggle: ReturnType<typeof vi.fn>;
    onAddLayer: ReturnType<typeof vi.fn>;
    onDeleteLayer: ReturnType<typeof vi.fn>;
    onDuplicateLayer: ReturnType<typeof vi.fn>;
    onLayerOpacityChange: ReturnType<typeof vi.fn>;
    onLayerBlendModeChange: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    container = document.createElement('div');
    callbacks = {
      appState: makeAppState(),
      onTogglePanel: vi.fn(),
      onLayerSelect: vi.fn(),
      onLayerVisibilityToggle: vi.fn(),
      onAddLayer: vi.fn(),
      onDeleteLayer: vi.fn(),
      onDuplicateLayer: vi.fn(),
      onLayerOpacityChange: vi.fn(),
      onLayerBlendModeChange: vi.fn(),
    };
  });

  it('renders visible panels', () => {
    renderPanels(container, callbacks);
    expect(container.querySelector('.fb-panel[data-panel-id="layers"]')).not.toBeNull();
    expect(container.querySelector('.fb-panel[data-panel-id="properties"]')).not.toBeNull();
    expect(container.querySelector('.fb-panel[data-panel-id="navigator"]')).toBeNull();
    expect(container.querySelector('.fb-panel[data-panel-id="history"]')).toBeNull();
  });

  it('renders layer list', () => {
    renderPanels(container, callbacks);
    const layersPanel = container.querySelector('.fb-panel[data-panel-id="layers"]')!;
    const layerItems = layersPanel.querySelectorAll('.fb-layer-item');
    expect(layerItems.length).toBe(1);
    expect(layerItems[0].querySelector('.fb-layer-name')?.textContent).toBe('Background');
  });

  it('marks active layer', () => {
    renderPanels(container, callbacks);
    const layersPanel = container.querySelector('.fb-panel[data-panel-id="layers"]')!;
    const activeItem = layersPanel.querySelector('.fb-layer-item.active');
    expect(activeItem).not.toBeNull();
  });

  it('calls onLayerSelect when layer item clicked', () => {
    renderPanels(container, callbacks);
    const layersPanel = container.querySelector('.fb-panel[data-panel-id="layers"]')!;
    const layerItem = layersPanel.querySelector('.fb-layer-item') as HTMLElement;
    layerItem.click();
    expect(callbacks.onLayerSelect).toHaveBeenCalledWith('layer-1');
  });

  it('calls onLayerVisibilityToggle when eye clicked', () => {
    renderPanels(container, callbacks);
    const layersPanel = container.querySelector('.fb-panel[data-panel-id="layers"]')!;
    const eyeBtn = layersPanel.querySelector('.fb-layer-eye') as HTMLButtonElement;
    eyeBtn.click();
    expect(callbacks.onLayerVisibilityToggle).toHaveBeenCalledWith('layer-1');
  });

  it('calls onAddLayer when add button clicked', () => {
    renderPanels(container, callbacks);
    const addBtn = container.querySelector('#fb-add-layer') as HTMLButtonElement;
    expect(addBtn).not.toBeNull();
    addBtn.click();
    expect(callbacks.onAddLayer).toHaveBeenCalledTimes(1);
  });

  it('calls onDeleteLayer when delete button clicked', () => {
    renderPanels(container, callbacks);
    const delBtn = container.querySelector('#fb-del-layer') as HTMLButtonElement;
    expect(delBtn).not.toBeNull();
    delBtn.click();
    expect(callbacks.onDeleteLayer).toHaveBeenCalledWith('layer-1');
  });

  it('renders layer opacity slider', () => {
    renderPanels(container, callbacks);
    const layersPanel = container.querySelector('.fb-panel[data-panel-id="layers"]')!;
    const opacityInput = layersPanel.querySelector('.fb-layer-opacity') as HTMLInputElement;
    expect(opacityInput).not.toBeNull();
    expect(opacityInput.type).toBe('range');
    expect(opacityInput.value).toBe('100');
  });

  it('renders layer blend mode selector', () => {
    renderPanels(container, callbacks);
    const layersPanel = container.querySelector('.fb-panel[data-panel-id="layers"]')!;
    const blendSelect = layersPanel.querySelector('.fb-layer-blend') as HTMLSelectElement;
    expect(blendSelect).not.toBeNull();
    expect(blendSelect.value).toBe('normal');
  });

  it('calls onLayerBlendModeChange when blend mode changed', () => {
    renderPanels(container, callbacks);
    const layersPanel = container.querySelector('.fb-panel[data-panel-id="layers"]')!;
    const blendSelect = layersPanel.querySelector('.fb-layer-blend') as HTMLSelectElement;
    blendSelect.value = 'multiply';
    blendSelect.dispatchEvent(new Event('change'));
    expect(callbacks.onLayerBlendModeChange).toHaveBeenCalledWith('layer-1', 'multiply');
  });

  it('renders properties panel with layer info', () => {
    renderPanels(container, callbacks);
    const propsPanel = container.querySelector('.fb-panel[data-panel-id="properties"]')!;
    expect(propsPanel.innerHTML).toContain('Opacity');
    expect(propsPanel.innerHTML).toContain('Fill');
    expect(propsPanel.innerHTML).toContain('Blend Mode');
  });

  it('renders navigator panel with zoom info', () => {
    const appState = makeAppState();
    appState.panels.find(p => p.id === 'navigator')!.visible = true;
    renderPanels(container, { ...callbacks, appState });
    const navPanel = container.querySelector('.fb-panel[data-panel-id="navigator"]')!;
    expect(navPanel.innerHTML).toContain('Zoom');
    expect(navPanel.innerHTML).toContain('100%');
  });

  it('renders history panel with history items', () => {
    const appState = makeAppState();
    appState.documents[0].history = [
      { id: 'h1', name: 'New Document', timestamp: 1 },
      { id: 'h2', name: 'Brush Stroke', timestamp: 2 },
    ];
    appState.documents[0].historyIndex = 1;
    appState.panels.find(p => p.id === 'history')!.visible = true;
    renderPanels(container, { ...callbacks, appState });
    const histPanel = container.querySelector('.fb-panel[data-panel-id="history"]')!;
    const items = histPanel.querySelectorAll('.fb-history-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toBe('New Document');
    expect(items[1].textContent).toBe('Brush Stroke');
    expect(items[1].classList.contains('active')).toBe(true);
  });

  it('shows no document message when no active document', () => {
    const appState = makeAppState();
    appState.activeDocumentId = null;
    renderPanels(container, { ...callbacks, appState });
    const layersPanel = container.querySelector('.fb-panel[data-panel-id="layers"]')!;
    expect(layersPanel.textContent).toContain('No document open');
  });
});
