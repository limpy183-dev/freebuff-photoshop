import type { AppState } from '../types';

interface StatusBarCallbacks {
  appState: AppState;
  onZoomChange: (zoom: number) => void;
}

export function renderStatusBar(container: HTMLElement, callbacks: StatusBarCallbacks): void {
  container.innerHTML = '';
  container.className = 'fb-status-bar';

  const doc = callbacks.appState.documents.find(d => d.id === callbacks.appState.activeDocumentId);
  const zoom = doc ? Math.round((doc.viewport?.zoom ?? 1) * 100) : 100;

  container.innerHTML = `
    <span class="fb-status-zoom">
      <select id="fb-zoom-select">
        <option value="0.01">1%</option>
        <option value="0.05">5%</option>
        <option value="0.1">10%</option>
        <option value="0.25">25%</option>
        <option value="0.5">50%</option>
        <option value="0.66">66.7%</option>
        <option value="1" ${zoom === 100 ? 'selected' : ''}>100%</option>
        <option value="1.5">150%</option>
        <option value="2">200%</option>
        <option value="3">300%</option>
        <option value="4">400%</option>
        <option value="8">800%</option>
        <option value="16">1600%</option>
      </select>
    </span>
    <span class="fb-status-doc-size">${doc ? `${doc.width} x ${doc.height} px` : ''}</span>
    <span class="fb-status-profile">${doc ? `RGB/8#` : ''}</span>
    <span class="fb-status-hint">Ready</span>
  `;

  const zoomSelect = container.querySelector('#fb-zoom-select') as HTMLSelectElement;
  if (zoomSelect) {
    zoomSelect.value = String(doc?.viewport?.zoom ?? 1);
    zoomSelect.addEventListener('change', () => {
      callbacks.onZoomChange(parseFloat(zoomSelect.value));
    });
  }
}
