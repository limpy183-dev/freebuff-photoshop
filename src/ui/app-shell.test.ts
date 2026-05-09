import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppShell } from './app-shell';
import { pushHistory } from '../core/history';

describe('AppShell constructor', () => {
  let container: HTMLDivElement;
  let appShell: AppShell;

  beforeEach(() => {
    container = document.createElement('div');
    appShell = new AppShell(container);
  });

  it('sets container className to fb-app', () => {
    expect(container.className).toBe('fb-app');
  });

  it('renders app frame structure', () => {
    expect(container.querySelector('.fb-app-frame')).not.toBeNull();
    expect(container.querySelector('#fb-menu-bar')).not.toBeNull();
    expect(container.querySelector('#fb-options-bar')).not.toBeNull();
    expect(container.querySelector('#fb-toolbar')).not.toBeNull();
    expect(container.querySelector('#fb-canvas-area')).not.toBeNull();
    expect(container.querySelector('#fb-main-canvas')).not.toBeNull();
    expect(container.querySelector('#fb-overlay-canvas')).not.toBeNull();
    expect(container.querySelector('#fb-panels-dock')).not.toBeNull();
    expect(container.querySelector('#fb-status-bar')).not.toBeNull();
    expect(container.querySelector('#fb-modal-overlay')).not.toBeNull();
  });

  it('creates an initial document', () => {
    const state = (appShell as any).appState;
    expect(state.documents.length).toBe(1);
    expect(state.activeDocumentId).not.toBeNull();
    const doc = state.documents[0];
    expect(doc.width).toBe(800);
    expect(doc.height).toBe(600);
    expect(doc.layers.length).toBe(1);
  });

  it('sets initial active tool to move', () => {
    const state = (appShell as any).appState;
    expect(state.activeToolId).toBe('move');
  });

  it('renders toolbar with move tool active', () => {
    const toolbar = container.querySelector('#fb-toolbar')!;
    const activeBtn = toolbar.querySelector('.fb-tool-btn.active');
    expect(activeBtn).not.toBeNull();
    expect((activeBtn as HTMLElement).dataset.toolId).toBe('move');
  });

  it('renders visible panels', () => {
    const panelsDock = container.querySelector('#fb-panels-dock')!;
    expect(panelsDock.querySelector('.fb-panel[data-panel-id="layers"]')).not.toBeNull();
    expect(panelsDock.querySelector('.fb-panel[data-panel-id="properties"]')).not.toBeNull();
    expect(panelsDock.querySelector('.fb-panel[data-panel-id="navigator"]')).toBeNull();
  });

  it('renders status bar with document size', () => {
    const statusBar = container.querySelector('#fb-status-bar')!;
    expect(statusBar.textContent).toContain('800 x 600');
  });
});

describe('AppShell keyboard shortcuts', () => {
  let container: HTMLDivElement;
  let appShell: AppShell;

  beforeEach(() => {
    container = document.createElement('div');
    appShell = new AppShell(container);
  });

  it('changes active tool on shortcut key', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
    const state = (appShell as any).appState;
    expect(state.activeToolId).toBe('brush');
    const toolbar = container.querySelector('#fb-toolbar')!;
    const activeBtn = toolbar.querySelector('.fb-tool-btn.active');
    expect((activeBtn as HTMLElement).dataset.toolId).toBe('brush');
  });

  it('changes active tool to eraser on e key', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    const state = (appShell as any).appState;
    expect(state.activeToolId).toBe('eraser');
  });

  it('does not change tool when ctrl is pressed', () => {
    const state = (appShell as any).appState;
    state.activeToolId = 'move';
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }));
    expect(state.activeToolId).toBe('move');
  });

  it('resets colors to default on d key', () => {
    const state = (appShell as any).appState;
    state.foregroundColor = { r: 128, g: 128, b: 128 };
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(state.foregroundColor).toEqual({ r: 0, g: 0, b: 0 });
    expect(state.backgroundColor).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('swaps colors on x key', () => {
    const state = (appShell as any).appState;
    state.foregroundColor = { r: 255, g: 0, b: 0 };
    state.backgroundColor = { r: 0, g: 0, b: 255 };
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    expect(state.foregroundColor).toEqual({ r: 0, g: 0, b: 255 });
    expect(state.backgroundColor).toEqual({ r: 255, g: 0, b: 0 });
  });
});

describe('AppShell new document shortcut', () => {
  let container: HTMLDivElement;
  let appShell: AppShell;

  beforeEach(() => {
    container = document.createElement('div');
    appShell = new AppShell(container);
  });

  it('creates new document on Ctrl+N', () => {
    const state = (appShell as any).appState;
    expect(state.documents.length).toBe(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }));
    expect(state.documents.length).toBe(2);
    expect(state.activeDocumentId).toBe(state.documents[1].id);
  });
});

describe('AppShell toolbar interaction', () => {
  let container: HTMLDivElement;
  let appShell: AppShell;

  beforeEach(() => {
    container = document.createElement('div');
    appShell = new AppShell(container);
  });

  it('changes active tool on toolbar button click', () => {
    const toolbar = container.querySelector('#fb-toolbar')!;
    const brushBtn = toolbar.querySelector('[data-tool-id="brush"]') as HTMLButtonElement;
    expect(brushBtn).not.toBeNull();
    brushBtn.click();
    const state = (appShell as any).appState;
    expect(state.activeToolId).toBe('brush');
    expect(toolbar.querySelector('.fb-tool-btn.active')?.getAttribute('data-tool-id')).toBe('brush');
  });
});

describe('AppShell layer operations', () => {
  let container: HTMLDivElement;
  let appShell: AppShell;

  beforeEach(() => {
    container = document.createElement('div');
    appShell = new AppShell(container);
  });

  it('adds new layer on add button click', () => {
    const state = (appShell as any).appState;
    const doc = state.documents[0];
    expect(doc.layers.length).toBe(1);
    const addBtn = container.querySelector('#fb-add-layer') as HTMLButtonElement;
    expect(addBtn).not.toBeNull();
    addBtn.click();
    expect(doc.layers.length).toBe(2);
    expect(doc.activeLayerId).toBe(doc.layers[doc.layers.length - 1].id);
  });

  it('toggles layer visibility on eye button click', () => {
    const state = (appShell as any).appState;
    const doc = state.documents[0];
    const initialVisibility = doc.layers[0].visible;
    const eyeBtn = container.querySelector('.fb-layer-eye') as HTMLButtonElement;
    expect(eyeBtn).not.toBeNull();
    eyeBtn.click();
    expect(doc.layers[0].visible).toBe(!initialVisibility);
  });

  it('selects layer on layer item click', () => {
    const state = (appShell as any).appState;
    const doc = state.documents[0];
    // Add a second layer first
    (appShell as any).addNewLayer();
    const firstLayerId = doc.layers[0].id;
    const secondLayerId = doc.layers[1].id;
    expect(doc.activeLayerId).toBe(secondLayerId);
    const layerItems = container.querySelectorAll('.fb-layer-item');
    // Layer items are rendered in reverse order
    (layerItems[layerItems.length - 1] as HTMLElement).click();
    expect(doc.activeLayerId).toBe(firstLayerId);
  });

  it('deletes active layer on delete button click', () => {
    const state = (appShell as any).appState;
    const doc = state.documents[0];
    const initialCount = doc.layers.length;
    const delBtn = container.querySelector('#fb-del-layer') as HTMLButtonElement;
    expect(delBtn).not.toBeNull();
    delBtn.click();
    expect(doc.layers.length).toBe(initialCount - 1);
  });
});

describe('AppShell undo/redo', () => {
  let container: HTMLDivElement;
  let appShell: AppShell;

  beforeEach(() => {
    container = document.createElement('div');
    appShell = new AppShell(container);
  });

  it('undo decrements history index', () => {
    const doc = (appShell as any).getActiveDocument();
    pushHistory(doc, 'Test Action');
    expect(doc.historyIndex).toBe(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(doc.historyIndex).toBe(0);
  });

  it('redo increments history index', () => {
    const doc = (appShell as any).getActiveDocument();
    pushHistory(doc, 'Test Action');
    expect(doc.historyIndex).toBe(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(doc.historyIndex).toBe(0);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
    expect(doc.historyIndex).toBe(1);
  });
});

describe('AppShell modals', () => {
  let container: HTMLDivElement;
  let appShell: AppShell;

  beforeEach(() => {
    container = document.createElement('div');
    appShell = new AppShell(container);
  });

  it('opens preferences modal', () => {
    (appShell as any).showPreferences();
    const overlay = container.querySelector('#fb-modal-overlay') as HTMLElement;
    expect(overlay.classList.contains('hidden')).toBe(false);
    expect(overlay.querySelector('.fb-modal')!.innerHTML).toContain('Preferences');
  });

  it('closes preferences modal on cancel', () => {
    (appShell as any).showPreferences();
    const overlay = container.querySelector('#fb-modal-overlay') as HTMLElement;
    const cancelBtn = overlay.querySelector('button')!;
    // The cancel button is the second button
    const buttons = overlay.querySelectorAll('button');
    (buttons[buttons.length - 1] as HTMLButtonElement).click();
    expect(overlay.classList.contains('hidden')).toBe(true);
  });

  it('opens color picker modal', () => {
    (appShell as any).openColorPicker('foreground');
    const overlay = container.querySelector('#fb-modal-overlay') as HTMLElement;
    expect(overlay.classList.contains('hidden')).toBe(false);
    expect(overlay.querySelector('.fb-color-picker')).not.toBeNull();
  });
});
