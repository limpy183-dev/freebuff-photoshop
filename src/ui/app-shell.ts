import type { AppState, Document, Layer, ToolDefinition, BlendMode } from '../types';
import { createViewport, setZoom } from '../core/viewport';
import { createDocument, getActiveLayer, flattenLayers } from '../core/document';
import { createPixelLayer } from '../core/layer';
import { pushHistory, undo, redo } from '../core/history';
import { createTool, BaseTool, TOOL_DEFINITIONS } from '../tools';
import { rgbToHex, hexToRgb } from '../utils';
import { renderCanvas as renderCanvasLayers, renderSelectionOverlay } from './canvas-renderer';
import { renderToolbar } from './toolbar';
import { renderPanels } from './panels';
import { renderMenuBar } from './menu-bar';
import { renderStatusBar } from './status-bar';
import { renderOptionsBar } from './options-bar';
import { renderColorPicker } from './color-picker';
import { openFile, saveAsPng, saveAsJpeg } from '../core/file-io';

export class AppShell {
  private container: HTMLElement;
  private appState: AppState;
  private activeTool: BaseTool | null = null;
  private canvasContainer: HTMLElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private rendering = false;
  private needsRender = true;

  constructor(container: HTMLElement) {
    this.container = container;
    this.appState = this.createInitialState();
    this.init();
  }

  private createInitialState(): AppState {
    return {
      documents: [],
      activeDocumentId: null,
      activeToolId: 'move',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      panels: [
        { id: 'layers', visible: true, docked: true, x: 0, y: 0, width: 250, height: 400 },
        { id: 'properties', visible: true, docked: true, x: 0, y: 0, width: 250, height: 300 },
        { id: 'navigator', visible: false, docked: true, x: 0, y: 0, width: 250, height: 200 },
        { id: 'history', visible: false, docked: true, x: 0, y: 0, width: 250, height: 300 },
        { id: 'channels', visible: false, docked: true, x: 0, y: 0, width: 250, height: 300 },
        { id: 'paths', visible: false, docked: true, x: 0, y: 0, width: 250, height: 300 },
        { id: 'info', visible: false, docked: true, x: 0, y: 0, width: 250, height: 200 },
        { id: 'swatches', visible: false, docked: true, x: 0, y: 0, width: 250, height: 300 },
      ],
      workspace: 'essentials',
      preferences: {
        historyStates: 50,
        autoSave: true,
        gridSize: 16,
        gridColor: '#808080',
        theme: 'dark',
        uiScaling: 1,
        performance: {
          cacheLevels: 4,
          tileSize: 128,
          useGPU: true,
        },
      },
      clipboard: null,
    };
  }

  private init(): void {
    this.container.className = 'fb-app';
    this.container.innerHTML = `
      <div class="fb-app-frame">
        <div class="fb-menu-bar" id="fb-menu-bar"></div>
        <div class="fb-options-bar" id="fb-options-bar"></div>
        <div class="fb-workspace">
          <div class="fb-toolbar" id="fb-toolbar"></div>
          <div class="fb-canvas-area" id="fb-canvas-area">
            <canvas id="fb-main-canvas" class="fb-main-canvas"></canvas>
            <canvas id="fb-overlay-canvas" class="fb-overlay-canvas"></canvas>
          </div>
          <div class="fb-panels-dock" id="fb-panels-dock"></div>
        </div>
        <div class="fb-status-bar" id="fb-status-bar"></div>
      </div>
      <div class="fb-modal-overlay hidden" id="fb-modal-overlay">
        <div class="fb-modal" id="fb-modal"></div>
      </div>
    `;

    this.canvasContainer = this.container.querySelector('#fb-canvas-area')!;
    this.canvasEl = this.container.querySelector('#fb-main-canvas')! as HTMLCanvasElement;
    this.overlayCanvas = this.container.querySelector('#fb-overlay-canvas')! as HTMLCanvasElement;

    this.renderUI();
    this.setupGlobalEvents();
    this.setupCanvasInteraction();
    this.startRenderLoop();

    this.newDocument(800, 600);
  }

  private renderUI(): void {
    renderMenuBar(this.container.querySelector('#fb-menu-bar')!, {
      onNew: () => this.newDocument(800, 600),
      onOpen: () => this.handleOpen(),
      onSave: () => this.handleSave(),
      onExport: () => this.handleExport(),
      onUndo: () => this.handleUndo(),
      onRedo: () => this.handleRedo(),
      onCut: () => this.handleCut(),
      onCopy: () => this.handleCopy(),
      onPaste: () => this.handlePaste(),
      onFill: () => this.handleFill(),
      onStroke: () => this.handleStroke(),
      onPreferences: () => this.showPreferences(),
    });

    renderToolbar(this.container.querySelector('#fb-toolbar')!, {
      activeToolId: this.appState.activeToolId,
      onToolSelect: (id) => this.setActiveTool(id),
    });

    renderPanels(this.container.querySelector('#fb-panels-dock')!, {
      appState: this.appState,
      onTogglePanel: (id) => this.togglePanel(id),
      onLayerSelect: (id) => this.selectLayer(id),
      onLayerVisibilityToggle: (id) => this.toggleLayerVisibility(id),
      onAddLayer: () => this.addNewLayer(),
      onDeleteLayer: (id) => this.deleteLayer(id),
      onDuplicateLayer: (id) => this.duplicateLayer(id),
      onLayerOpacityChange: (id, val) => this.setLayerOpacity(id, val),
      onLayerBlendModeChange: (id, mode) => this.setLayerBlendMode(id, mode),
    });

    renderOptionsBar(this.container.querySelector('#fb-options-bar')!, {
      activeToolId: this.appState.activeToolId,
      toolOptions: this.appState.toolOptions,
      onOptionChange: (toolId, key, value) => {
        if (!this.appState.toolOptions[toolId]) {
          this.appState.toolOptions[toolId] = {};
        }
        this.appState.toolOptions[toolId][key] = value;
        // Don't re-render options bar on option change to preserve input focus
        this.needsRender = true;
      },
      foregroundColor: this.appState.foregroundColor,
      backgroundColor: this.appState.backgroundColor,
      onColorChange: (type, color) => {
        if (type === 'foreground') this.appState.foregroundColor = color;
        else this.appState.backgroundColor = color;
        this.renderUI();
      },
      onColorPickerOpen: (type) => this.openColorPicker(type),
    });

    renderStatusBar(this.container.querySelector('#fb-status-bar')!, {
      appState: this.appState,
      onZoomChange: (zoom) => {
        const doc = this.getActiveDocument();
        if (!doc) return;
        setZoom(doc.viewport ?? createViewport(), zoom);
        this.needsRender = true;
      },
    });
  }

  private setupGlobalEvents(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) this.handleRedo();
        else this.handleUndo();
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleRedo();
      } else if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleOpen();
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleSave();
      } else if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.newDocument(800, 600);
      } else if (e.key === 'd') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          this.appState.foregroundColor = { r: 0, g: 0, b: 0 };
          this.appState.backgroundColor = { r: 255, g: 255, b: 255 };
          this.renderUI();
        }
      } else if (e.key === 'x') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          const tmp = this.appState.foregroundColor;
          this.appState.foregroundColor = this.appState.backgroundColor;
          this.appState.backgroundColor = tmp;
          this.renderUI();
        }
      }

      // Tool shortcuts
      const shortcuts: Record<string, string> = {
        'v': 'move', 'm': 'marquee-rect', 'l': 'lasso', 'w': 'magic-wand',
        'c': 'crop', 'i': 'eyedropper', 'j': 'spot-healing', 'b': 'brush',
        's': 'clone-stamp', 'e': 'eraser', 'g': 'gradient', 'o': 'dodge',
        'p': 'pen', 't': 'horizontal-type', 'a': 'path-selection',
        'u': 'rectangle', 'h': 'hand', 'r': 'rotate-view', 'z': 'zoom',
      };
      if (!e.ctrlKey && !e.metaKey && !e.altKey && shortcuts[e.key]) {
        this.setActiveTool(shortcuts[e.key]);
      }

      this.activeTool?.onKeyDown(e);
    });

    window.addEventListener('keyup', (e) => {
      this.activeTool?.onKeyUp(e);
    });

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.needsRender = true;
    });
  }

  private setupCanvasInteraction(): void {
    if (!this.canvasEl || !this.overlayCanvas || !this.canvasContainer) return;

    const onPointerDown = (e: PointerEvent) => {
      (this.canvasEl as HTMLCanvasElement).setPointerCapture(e.pointerId);
      this.activeTool?.onPointerDown(e);
      this.needsRender = true;
    };

    const onPointerMove = (e: PointerEvent) => {
      this.activeTool?.onPointerMove(e);
      this.needsRender = true;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (this.canvasEl?.hasPointerCapture?.(e.pointerId)) {
        this.canvasEl.releasePointerCapture(e.pointerId);
      }
      this.activeTool?.onPointerUp(e);
      this.needsRender = true;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const doc = this.getActiveDocument();
      if (!doc || !this.canvasEl) return;

      if (e.ctrlKey || e.metaKey) {
        const rect = this.canvasEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.01, Math.min(128, (doc.viewport?.zoom ?? 1) * zoomFactor));
        const zoomRatio = newZoom / (doc.viewport?.zoom ?? 1);
        if (!doc.viewport) doc.viewport = createViewport();
        doc.viewport.zoom = newZoom;
        doc.viewport.panX = x - (x - doc.viewport.panX) * zoomRatio;
        doc.viewport.panY = y - (y - doc.viewport.panY) * zoomRatio;
        this.needsRender = true;
      } else {
        if (!doc.viewport) doc.viewport = createViewport();
        doc.viewport.panX -= e.deltaX;
        doc.viewport.panY -= e.deltaY;
        this.needsRender = true;
      }
    };

    this.canvasEl.addEventListener('pointerdown', onPointerDown);
    this.canvasEl.addEventListener('pointermove', onPointerMove);
    this.canvasEl.addEventListener('pointerup', onPointerUp);
    this.canvasEl.addEventListener('pointercancel', onPointerUp);
    this.canvasEl.addEventListener('wheel', onWheel, { passive: false });
  }

  private needsOverlayRender = false;

  private startRenderLoop(): void {
    const loop = () => {
      const doc = this.getActiveDocument();
      const hasSelection = doc?.selection?.mask != null;
      if (hasSelection) {
        this.needsOverlayRender = true;
      }
      if (this.needsRender) {
        this.renderMainCanvas();
        this.needsRender = false;
      }
      if (this.needsOverlayRender) {
        this.renderOverlayCanvas();
        this.needsOverlayRender = false;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private renderMainCanvas(): void {
    const doc = this.getActiveDocument();
    if (!doc || !this.canvasEl) return;
    if (!doc.viewport) doc.viewport = createViewport();

    renderCanvasLayers(this.canvasEl, doc, this.appState);
    // Also re-render overlay when main canvas changes
    this.needsOverlayRender = true;
  }

  private renderOverlayCanvas(): void {
    const doc = this.getActiveDocument();
    if (!doc || !this.overlayCanvas) return;

    renderSelectionOverlay(this.overlayCanvas, doc, this.appState);
  }

  private resizeCanvas(): void {
    this.needsRender = true;
  }

  private getActiveDocument(): Document | null {
    const doc = this.appState.documents.find(d => d.id === this.appState.activeDocumentId);
    if (doc && !doc.viewport) {
      doc.viewport = createViewport();
    }
    return doc ?? null;
  }

  private setActiveTool(toolId: string): void {
    const doc = this.getActiveDocument();
    if (this.activeTool) {
      this.activeTool.deactivate();
    }

    this.appState.activeToolId = toolId;
    const tool = createTool(toolId);

    if (tool && doc && this.canvasEl) {
      tool.activate({
        appState: this.appState,
        document: doc,
        viewport: doc.viewport!,
        canvasEl: this.canvasEl,
        commitCallback: (name: string) => {
          pushHistory(doc, name);
          this.needsRender = true;
          this.renderUI();
        },
      });
      this.activeTool = tool;
    } else {
      this.activeTool = null;
    }

    this.renderUI();
    this.needsRender = true;
  }

  private newDocument(width: number, height: number): void {
    const doc = createDocument(width, height, `Untitled-${this.appState.documents.length + 1}`);
    doc.viewport = createViewport();
    this.appState.documents.push(doc);
    this.appState.activeDocumentId = doc.id;
    pushHistory(doc, 'New Document');
    this.setActiveTool(this.appState.activeToolId);
    this.renderUI();
    this.needsRender = true;
  }

  private handleOpen(): void {
    openFile((imageData, name) => {
      const doc = createDocument(imageData.width, imageData.height, name.replace(/\.[^/.]+$/, ''));
      const layer = doc.layers[0];
      if (layer && layer.canvas) {
        const ctx = layer.canvas.getContext('2d')!;
        ctx.putImageData(imageData, 0, 0);
      }
    doc.viewport = createViewport();
    this.appState.documents.push(doc);
    this.appState.activeDocumentId = doc.id;
    pushHistory(doc, 'Open');
    this.setActiveTool(this.appState.activeToolId);
      this.renderUI();
      this.needsRender = true;
    });
  }

  private handleSave(): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    saveAsPng(doc, doc.name + '.png');
  }

  private handleExport(): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    saveAsJpeg(doc, doc.name + '.jpg', 0.9);
  }

  private handleUndo(): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    undo(doc);
    this.needsRender = true;
    this.renderUI();
  }

  private handleRedo(): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    redo(doc);
    this.needsRender = true;
    this.renderUI();
  }

  private handleCut(): void {
    this.handleCopy();
    this.handleClear();
  }

  private handleCopy(): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    const layer = getActiveLayer(doc);
    if (!layer || !layer.canvas) return;
    const ctx = layer.canvas.getContext('2d')!;
    this.appState.clipboard = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
  }

  private handlePaste(): void {
    const doc = this.getActiveDocument();
    if (!doc || !this.appState.clipboard) return;
    const newLayer = createPixelLayer(this.appState.clipboard.width, this.appState.clipboard.height, 'Pasted');
    const ctx = newLayer.canvas!.getContext('2d')!;
    ctx.putImageData(this.appState.clipboard, 0, 0);
    doc.layers.push(newLayer);
    doc.activeLayerId = newLayer.id;
    pushHistory(doc, 'Paste');
    this.needsRender = true;
    this.renderUI();
  }

  private handleClear(): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    const layer = getActiveLayer(doc);
    if (!layer || !layer.canvas) return;
    const ctx = layer.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    pushHistory(doc, 'Clear');
    this.needsRender = true;
  }

  private handleFill(): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    const layer = getActiveLayer(doc);
    if (!layer || !layer.canvas) return;
    const ctx = layer.canvas.getContext('2d')!;
    const color = this.appState.foregroundColor;
    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
    pushHistory(doc, 'Fill');
    this.needsRender = true;
  }

  private handleStroke(): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    const layer = getActiveLayer(doc);
    if (!layer || !layer.canvas) return;
    const ctx = layer.canvas.getContext('2d')!;
    const color = this.appState.foregroundColor;
    ctx.strokeStyle = `rgb(${color.r},${color.g},${color.b})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, layer.canvas.width, layer.canvas.height);
    pushHistory(doc, 'Stroke');
    this.needsRender = true;
  }

  private togglePanel(id: string): void {
    const panel = this.appState.panels.find(p => p.id === id);
    if (panel) panel.visible = !panel.visible;
    this.renderUI();
  }

  private selectLayer(id: string): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    doc.activeLayerId = id;
    this.renderUI();
    this.needsRender = true;
  }

  private toggleLayerVisibility(id: string): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    const layer = doc.layers.find(l => l.id === id);
    if (layer) layer.visible = !layer.visible;
    this.needsRender = true;
    this.renderUI();
  }

  private addNewLayer(): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    const newLayer = createPixelLayer(doc.width, doc.height, `Layer ${doc.layers.length + 1}`);
    doc.layers.push(newLayer);
    doc.activeLayerId = newLayer.id;
    pushHistory(doc, 'New Layer');
    this.renderUI();
    this.needsRender = true;
  }

  private deleteLayer(id: string): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    doc.layers = doc.layers.filter(l => l.id !== id);
    if (doc.activeLayerId === id) {
      doc.activeLayerId = doc.layers[doc.layers.length - 1]?.id ?? null;
    }
    pushHistory(doc, 'Delete Layer');
    this.renderUI();
    this.needsRender = true;
  }

  private duplicateLayer(id: string): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    const layer = doc.layers.find(l => l.id === id);
    if (!layer || !layer.canvas) return;
    const newCanvas = document.createElement('canvas');
    newCanvas.width = layer.canvas.width;
    newCanvas.height = layer.canvas.height;
    newCanvas.getContext('2d')!.drawImage(layer.canvas, 0, 0);
    const newLayer = { ...layer, id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, name: `${layer.name} copy`, canvas: newCanvas };
    doc.layers.push(newLayer);
    doc.activeLayerId = newLayer.id;
    pushHistory(doc, 'Duplicate Layer');
    this.renderUI();
    this.needsRender = true;
  }

  private setLayerOpacity(id: string, opacity: number): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    const layer = doc.layers.find(l => l.id === id);
    if (layer) layer.opacity = opacity;
    this.needsRender = true;
  }

  private setLayerBlendMode(id: string, mode: string): void {
    const doc = this.getActiveDocument();
    if (!doc) return;
    const layer = doc.layers.find(l => l.id === id);
    if (layer) layer.blendMode = mode as BlendMode;
    this.needsRender = true;
  }

  private showPreferences(): void {
    const overlay = this.container.querySelector('#fb-modal-overlay') as HTMLElement;
    const modal = this.container.querySelector('#fb-modal') as HTMLElement;
    if (!overlay || !modal) return;
    overlay.classList.remove('hidden');
    modal.innerHTML = `<div style="padding:20px;color:#ccc;">
      <h3>Preferences</h3>
      <p>History States: <input type="number" value="${this.appState.preferences.historyStates}" id="pref-history"></p>
      <p>Theme: <select id="pref-theme"><option value="dark" ${this.appState.preferences.theme === 'dark' ? 'selected' : ''}>Dark</option><option value="light">Light</option></select></p>
      <p>Auto Save: <input type="checkbox" ${this.appState.preferences.autoSave ? 'checked' : ''} id="pref-autosave"></p>
      <button id="pref-ok" style="margin-top:10px;padding:6px 14px;background:#3a3a3a;border:1px solid #555;color:#ccc;cursor:pointer;">OK</button>
      <button id="pref-cancel" style="margin-top:10px;padding:6px 14px;background:#3a3a3a;border:1px solid #555;color:#ccc;cursor:pointer;margin-left:8px;">Cancel</button>
    </div>`;

    modal.querySelector('#pref-ok')?.addEventListener('click', () => {
      const hist = modal.querySelector('#pref-history') as HTMLInputElement;
      const theme = modal.querySelector('#pref-theme') as HTMLSelectElement;
      const autoSave = modal.querySelector('#pref-autosave') as HTMLInputElement;
      if (hist) this.appState.preferences.historyStates = parseInt(hist.value);
      if (theme) this.appState.preferences.theme = theme.value as 'dark' | 'light';
      if (autoSave) this.appState.preferences.autoSave = autoSave.checked;
      overlay.classList.add('hidden');
      this.renderUI();
    });

    modal.querySelector('#pref-cancel')?.addEventListener('click', () => {
      overlay.classList.add('hidden');
    });
  }

  private openColorPicker(type: 'foreground' | 'background'): void {
    const overlay = this.container.querySelector('#fb-modal-overlay') as HTMLElement;
    const modal = this.container.querySelector('#fb-modal') as HTMLElement;
    if (!overlay || !modal) return;
    overlay.classList.remove('hidden');
    const currentColor = type === 'foreground' ? this.appState.foregroundColor : this.appState.backgroundColor;
    renderColorPicker(modal, currentColor, (color) => {
      if (type === 'foreground') this.appState.foregroundColor = color;
      else this.appState.backgroundColor = color;
      this.renderUI();
    });
  }
}
