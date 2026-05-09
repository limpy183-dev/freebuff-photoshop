import type { Document, HistoryState, Layer, DocumentSnapshot } from '../types';

const MAX_HISTORY = 50;

function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map(layer => {
    let clonedCanvas: HTMLCanvasElement | null = null;
    if (layer.canvas && layer.canvas instanceof HTMLCanvasElement) {
      clonedCanvas = document.createElement('canvas');
      clonedCanvas.width = layer.canvas.width;
      clonedCanvas.height = layer.canvas.height;
      const ctx = clonedCanvas.getContext('2d')!;
      ctx.drawImage(layer.canvas, 0, 0);
    }

    const cloned: Layer = {
      ...layer,
      id: layer.id,
      canvas: clonedCanvas,
      children: layer.children ? cloneLayers(layer.children) : undefined,
    };
    return cloned;
  });
}

function takeSnapshot(doc: Document): DocumentSnapshot {
  return {
    id: doc.id,
    name: doc.name,
    width: doc.width,
    height: doc.height,
    resolution: doc.resolution,
    colorMode: doc.colorMode,
    bitDepth: doc.bitDepth,
    layers: cloneLayers(doc.layers),
    activeLayerId: doc.activeLayerId,
    guides: [...doc.guides],
    selection: doc.selection,
    backgroundColor: { ...doc.backgroundColor },
  };
}

export function pushHistory(doc: Document, name: string, command?: HistoryState['command']): void {
  if (doc.historyIndex < doc.history.length - 1) {
    doc.history = doc.history.slice(0, doc.historyIndex + 1);
  }

  const state: HistoryState = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name,
    timestamp: Date.now(),
    documentSnapshot: takeSnapshot(doc),
    command,
  };

  doc.history.push(state);

  if (doc.history.length > MAX_HISTORY) {
    doc.history.shift();
  }
  doc.historyIndex = doc.history.length - 1;
}

export function canUndo(doc: Document): boolean {
  return doc.historyIndex > 0;
}

export function canRedo(doc: Document): boolean {
  return doc.historyIndex < doc.history.length - 1;
}

export function undo(doc: Document): void {
  if (!canUndo(doc)) return;
  doc.historyIndex--;
  const state = doc.history[doc.historyIndex];
  if (state?.documentSnapshot) {
    restoreSnapshot(doc, state.documentSnapshot);
  }
}

export function redo(doc: Document): void {
  if (!canRedo(doc)) return;
  doc.historyIndex++;
  const state = doc.history[doc.historyIndex];
  if (state?.documentSnapshot) {
    restoreSnapshot(doc, state.documentSnapshot);
  }
}

function restoreSnapshot(doc: Document, snapshot: DocumentSnapshot): void {
  doc.name = snapshot.name;
  doc.width = snapshot.width;
  doc.height = snapshot.height;
  doc.resolution = snapshot.resolution;
  doc.colorMode = snapshot.colorMode;
  doc.bitDepth = snapshot.bitDepth;
  doc.layers = snapshot.layers;
  doc.activeLayerId = snapshot.activeLayerId;
  doc.guides = snapshot.guides;
  doc.selection = snapshot.selection;
  doc.backgroundColor = snapshot.backgroundColor;
}
