import type { AppState, Document, Layer } from '../types';

const layerThumbCache = new WeakMap<HTMLCanvasElement, string>();

interface PanelCallbacks {
  appState: AppState;
  onTogglePanel: (id: string) => void;
  onLayerSelect: (id: string) => void;
  onLayerVisibilityToggle: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onLayerOpacityChange: (id: string, val: number) => void;
  onLayerBlendModeChange: (id: string, mode: string) => void;
}

export function renderPanels(container: HTMLElement, callbacks: PanelCallbacks): void {
  container.innerHTML = '';
  container.className = 'fb-panels-dock';

  const doc = callbacks.appState.documents.find(d => d.id === callbacks.appState.activeDocumentId);

  // Layers Panel
  if (callbacks.appState.panels.find(p => p.id === 'layers')?.visible) {
    const layersPanel = createPanel('layers', 'Layers');
    renderLayersContent(layersPanel, doc, callbacks);
    container.appendChild(layersPanel);
  }

  // Properties Panel
  if (callbacks.appState.panels.find(p => p.id === 'properties')?.visible) {
    const propsPanel = createPanel('properties', 'Properties');
    renderPropertiesContent(propsPanel, doc, callbacks);
    container.appendChild(propsPanel);
  }

  // Navigator Panel
  if (callbacks.appState.panels.find(p => p.id === 'navigator')?.visible) {
    const navPanel = createPanel('navigator', 'Navigator');
    renderNavigatorContent(navPanel, doc, callbacks);
    container.appendChild(navPanel);
  }

  // History Panel
  if (callbacks.appState.panels.find(p => p.id === 'history')?.visible) {
    const histPanel = createPanel('history', 'History');
    renderHistoryContent(histPanel, doc, callbacks);
    container.appendChild(histPanel);
  }
}

function createPanel(id: string, title: string): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'fb-panel';
  panel.dataset.panelId = id;

  const header = document.createElement('div');
  header.className = 'fb-panel-header';
  header.innerHTML = `<span>${title}</span><button class="fb-panel-close">×</button>`;
  panel.appendChild(header);

  const content = document.createElement('div');
  content.className = 'fb-panel-content';
  content.id = `fb-panel-${id}`;
  panel.appendChild(content);

  return panel;
}

function renderLayersContent(panel: HTMLElement, doc: Document | undefined, callbacks: PanelCallbacks): void {
  const content = panel.querySelector('.fb-panel-content') as HTMLElement;
  if (!content) return;
  content.innerHTML = '';

  if (!doc) {
    content.textContent = 'No document open';
    return;
  }

  const controls = document.createElement('div');
  controls.className = 'fb-layer-controls';
  controls.innerHTML = `
    <select class="fb-layer-filter"><option>Kind</option><option>Name</option><option>Effect</option></select>
    <button class="fb-layer-btn" id="fb-add-layer" title="New Layer">+</button>
    <button class="fb-layer-btn" id="fb-del-layer" title="Delete Layer">🗑</button>
  `;
  content.appendChild(controls);

  const list = document.createElement('div');
  list.className = 'fb-layer-list';

  [...doc.layers].reverse().forEach(layer => {
    const item = document.createElement('div');
    item.className = `fb-layer-item${layer.id === doc.activeLayerId ? ' active' : ''}`;
    item.dataset.layerId = layer.id;

    const eye = document.createElement('button');
    eye.className = `fb-layer-eye${layer.visible ? '' : ' off'}`;
    eye.innerHTML = '👁';
    eye.addEventListener('click', (e) => {
      e.stopPropagation();
      callbacks.onLayerVisibilityToggle(layer.id);
    });

    const thumb = document.createElement('div');
    thumb.className = 'fb-layer-thumb';
    if (layer.canvas) {
      const canvasEl = layer.canvas as HTMLCanvasElement;
      let dataUrl = layerThumbCache.get(canvasEl);
      if (!dataUrl) {
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 28;
        thumbCanvas.height = 28;
        const tctx = thumbCanvas.getContext('2d')!;
        tctx.drawImage(canvasEl, 0, 0, canvasEl.width, canvasEl.height, 0, 0, 28, 28);
        dataUrl = thumbCanvas.toDataURL('image/png');
        layerThumbCache.set(canvasEl, dataUrl);
      }
      thumb.style.backgroundImage = `url(${dataUrl})`;
    }

    const name = document.createElement('span');
    name.className = 'fb-layer-name';
    name.textContent = layer.name;
    name.contentEditable = 'true';
    name.addEventListener('blur', () => {
      layer.name = name.textContent || 'Layer';
    });
    name.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); name.blur(); }
    });

    const opacity = document.createElement('input');
    opacity.type = 'range';
    opacity.className = 'fb-layer-opacity';
    opacity.min = '0';
    opacity.max = '100';
    opacity.value = String(layer.opacity);
    opacity.title = `Opacity: ${layer.opacity}%`;
    opacity.addEventListener('input', () => callbacks.onLayerOpacityChange(layer.id, parseInt(opacity.value)));

    const blendMode = document.createElement('select');
    blendMode.className = 'fb-layer-blend';
    blendMode.innerHTML = `
      <option value="normal">Normal</option>
      <option value="dissolve">Dissolve</option>
      <option value="darken">Darken</option>
      <option value="multiply">Multiply</option>
      <option value="colorburn">Color Burn</option>
      <option value="screen">Screen</option>
      <option value="colordodge">Color Dodge</option>
      <option value="overlay">Overlay</option>
      <option value="softlight">Soft Light</option>
      <option value="hardlight">Hard Light</option>
      <option value="difference">Difference</option>
      <option value="exclusion">Exclusion</option>
      <option value="hue">Hue</option>
      <option value="saturation">Saturation</option>
      <option value="color">Color</option>
      <option value="luminosity">Luminosity</option>
    `;
    blendMode.value = layer.blendMode;
    blendMode.addEventListener('change', () => callbacks.onLayerBlendModeChange(layer.id, blendMode.value));

    item.appendChild(eye);
    item.appendChild(thumb);
    item.appendChild(name);
    item.appendChild(blendMode);
    item.appendChild(opacity);

    item.addEventListener('click', () => callbacks.onLayerSelect(layer.id));

    list.appendChild(item);
  });

  content.appendChild(list);

  content.querySelector('#fb-add-layer')?.addEventListener('click', callbacks.onAddLayer);
  content.querySelector('#fb-del-layer')?.addEventListener('click', () => {
    const active = doc.layers.find(l => l.id === doc.activeLayerId);
    if (active) callbacks.onDeleteLayer(active.id);
  });
}

function renderPropertiesContent(panel: HTMLElement, doc: Document | undefined, callbacks: PanelCallbacks): void {
  const content = panel.querySelector('.fb-panel-content') as HTMLElement;
  if (!content) return;
  content.innerHTML = '';

  if (!doc) {
    content.textContent = 'No document open';
    return;
  }

  const layer = doc.layers.find(l => l.id === doc.activeLayerId);
  if (!layer) return;

  const props = document.createElement('div');
  props.className = 'fb-properties';
  props.innerHTML = `
    <div class="fb-prop-row"><label>Opacity</label><input type="range" min="0" max="100" value="${layer.opacity}"></div>
    <div class="fb-prop-row"><label>Fill</label><input type="range" min="0" max="100" value="${layer.fillOpacity}"></div>
    <div class="fb-prop-row"><label>Blend Mode</label><select>${['Normal','Darken','Multiply','Screen','Overlay','Difference','Hue','Color'].map(m => `<option>${m}</option>`).join('')}</select></div>
    <div class="fb-prop-row"><label>Position</label><span>${layer.bounds.x}, ${layer.bounds.y}</span></div>
    <div class="fb-prop-row"><label>Dimensions</label><span>${layer.bounds.width} × ${layer.bounds.height}</span></div>
  `;
  content.appendChild(props);
}

function renderNavigatorContent(panel: HTMLElement, doc: Document | undefined, callbacks: PanelCallbacks): void {
  const content = panel.querySelector('.fb-panel-content') as HTMLElement;
  if (!content) return;
  content.innerHTML = '';

  if (!doc) {
    content.textContent = 'No document open';
    return;
  }

  const info = document.createElement('div');
  info.className = 'fb-navigator-info';
  info.innerHTML = `
    <div>Zoom: ${Math.round((doc.viewport?.zoom ?? 1) * 100)}%</div>
    <div>Size: ${doc.width} × ${doc.height}</div>
  `;
  content.appendChild(info);
}

function renderHistoryContent(panel: HTMLElement, doc: Document | undefined, callbacks: PanelCallbacks): void {
  const content = panel.querySelector('.fb-panel-content') as HTMLElement;
  if (!content) return;
  content.innerHTML = '';

  if (!doc) {
    content.textContent = 'No document open';
    return;
  }

  const list = document.createElement('div');
  list.className = 'fb-history-list';

  doc.history.forEach((state, index) => {
    const item = document.createElement('div');
    item.className = `fb-history-item${index === doc.historyIndex ? ' active' : index > doc.historyIndex ? ' future' : ''}`;
    item.textContent = state.name;
    list.appendChild(item);
  });

  content.appendChild(list);
}
