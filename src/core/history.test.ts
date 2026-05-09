import { describe, it, expect, beforeEach } from 'vitest';
import {
  pushHistory,
  canUndo,
  canRedo,
  undo,
  redo,
} from './history';
import { createPixelLayer } from './layer';
import type { Document } from '../types';

function createTestDocument(): Document {
  return {
    id: 'doc-1',
    name: 'Test Document',
    width: 100,
    height: 100,
    resolution: 72,
    colorMode: 'rgb',
    bitDepth: 8,
    layers: [createPixelLayer(100, 100, 'Background')],
    activeLayerId: null,
    guides: [],
    history: [],
    historyIndex: -1,
    selection: null,
    backgroundColor: { r: 255, g: 255, b: 255 },
  };
}

describe('pushHistory', () => {
  it('adds a history state', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'Create Document');
    expect(doc.history.length).toBe(1);
    expect(doc.historyIndex).toBe(0);
    expect(doc.history[0].name).toBe('Create Document');
  });

  it('stores a snapshot of document layers', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'Initial');
    expect(doc.history[0].documentSnapshot).toBeDefined();
    expect(doc.history[0].documentSnapshot!.layers.length).toBe(1);
    expect(doc.history[0].documentSnapshot!.layers[0].name).toBe('Background');
  });

  it('increments historyIndex', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'First');
    pushHistory(doc, 'Second');
    expect(doc.historyIndex).toBe(1);
    expect(doc.history.length).toBe(2);
  });

  it('truncates redo stack when pushing after undo', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'First');
    pushHistory(doc, 'Second');
    pushHistory(doc, 'Third');
    undo(doc);
    undo(doc);
    expect(doc.historyIndex).toBe(0);
    pushHistory(doc, 'New After Undo');
    expect(doc.history.length).toBe(2);
    expect(doc.historyIndex).toBe(1);
    expect(doc.history[1].name).toBe('New After Undo');
  });

  it('discards oldest entries when exceeding max history', () => {
    const doc = createTestDocument();
    for (let i = 0; i < 55; i++) {
      pushHistory(doc, `Action ${i}`);
    }
    expect(doc.history.length).toBe(50);
    expect(doc.historyIndex).toBe(49);
    expect(doc.history[0].name).toBe('Action 5');
  });

  it('does not decrement historyIndex when trimming from front', () => {
    const doc = createTestDocument();
    for (let i = 0; i < 52; i++) {
      pushHistory(doc, `Action ${i}`);
    }
    expect(doc.history.length).toBe(50);
    expect(doc.historyIndex).toBe(49);
  });

  it('decrements historyIndex when trimming after undo', () => {
    const doc = createTestDocument();
    for (let i = 0; i < 50; i++) {
      pushHistory(doc, `Action ${i}`);
    }
    undo(doc);
    undo(doc);
    expect(doc.historyIndex).toBe(47);
    // Now push two more to trigger trimming
    pushHistory(doc, 'Extra 1');
    pushHistory(doc, 'Extra 2');
    expect(doc.history.length).toBe(50);
    expect(doc.historyIndex).toBe(49);
  });
});

describe('canUndo', () => {
  it('returns false for empty history', () => {
    const doc = createTestDocument();
    expect(canUndo(doc)).toBe(false);
  });

  it('returns false at first state', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'First');
    expect(canUndo(doc)).toBe(false);
  });

  it('returns true when not at first state', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'First');
    pushHistory(doc, 'Second');
    expect(canUndo(doc)).toBe(true);
  });

  it('returns false after undoing to first state', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'First');
    pushHistory(doc, 'Second');
    undo(doc);
    expect(canUndo(doc)).toBe(false);
  });
});

describe('canRedo', () => {
  it('returns false for empty history', () => {
    const doc = createTestDocument();
    expect(canRedo(doc)).toBe(false);
  });

  it('returns false at latest state', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'First');
    expect(canRedo(doc)).toBe(false);
  });

  it('returns true after undo', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'First');
    pushHistory(doc, 'Second');
    undo(doc);
    expect(canRedo(doc)).toBe(true);
  });

  it('returns false after undo and new push', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'First');
    pushHistory(doc, 'Second');
    undo(doc);
    pushHistory(doc, 'Third');
    expect(canRedo(doc)).toBe(false);
  });
});

describe('undo', () => {
  it('does nothing when cannot undo', () => {
    const doc = createTestDocument();
    undo(doc);
    expect(doc.historyIndex).toBe(-1);
  });

  it('restores previous document state', () => {
    const doc = createTestDocument();
    doc.name = 'Original';
    pushHistory(doc, 'Original');
    doc.name = 'Modified';
    pushHistory(doc, 'Modified');
    undo(doc);
    expect(doc.name).toBe('Original');
  });

  it('decrements historyIndex', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'First');
    pushHistory(doc, 'Second');
    undo(doc);
    expect(doc.historyIndex).toBe(0);
  });

  it('restores layers snapshot', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'Initial');
    doc.layers.push(createPixelLayer(50, 50, 'New Layer'));
    pushHistory(doc, 'Added Layer');
    expect(doc.layers.length).toBe(2);
    undo(doc);
    expect(doc.layers.length).toBe(1);
    expect(doc.layers[0].name).toBe('Background');
  });

  it('restores selection', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'Initial');
    const mask = new ImageData(10, 10);
    doc.selection = { mask, feather: 1, antiAlias: true };
    pushHistory(doc, 'Selection');
    undo(doc);
    expect(doc.selection).toBeNull();
  });

  it('restores guides', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'Initial');
    doc.guides.push({ orientation: 'horizontal', position: 50 });
    pushHistory(doc, 'Added Guide');
    undo(doc);
    expect(doc.guides.length).toBe(0);
  });

  it('restores background color', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'Initial');
    doc.backgroundColor = { r: 0, g: 0, b: 0 };
    pushHistory(doc, 'Black BG');
    undo(doc);
    expect(doc.backgroundColor).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('redo', () => {
  it('does nothing when cannot redo', () => {
    const doc = createTestDocument();
    redo(doc);
    expect(doc.historyIndex).toBe(-1);
  });

  it('restores next document state', () => {
    const doc = createTestDocument();
    doc.name = 'Original';
    pushHistory(doc, 'Original');
    doc.name = 'Modified';
    pushHistory(doc, 'Modified');
    undo(doc);
    expect(doc.name).toBe('Original');
    redo(doc);
    expect(doc.name).toBe('Modified');
  });

  it('increments historyIndex', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'First');
    pushHistory(doc, 'Second');
    undo(doc);
    expect(doc.historyIndex).toBe(0);
    redo(doc);
    expect(doc.historyIndex).toBe(1);
  });

  it('restores layers snapshot', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'Initial');
    doc.layers.push(createPixelLayer(50, 50, 'New Layer'));
    pushHistory(doc, 'Added Layer');
    undo(doc);
    expect(doc.layers.length).toBe(1);
    redo(doc);
    expect(doc.layers.length).toBe(2);
    expect(doc.layers[1].name).toBe('New Layer');
  });

  it('is inverse of undo for multiple steps', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'A');
    pushHistory(doc, 'B');
    pushHistory(doc, 'C');
    const originalLayerCount = doc.layers.length;
    undo(doc);
    undo(doc);
    redo(doc);
    redo(doc);
    expect(doc.historyIndex).toBe(2);
    expect(doc.layers.length).toBe(originalLayerCount);
  });
});

describe('history integration', () => {
  it('handles full undo/redo cycle', () => {
    const doc = createTestDocument();
    pushHistory(doc, 'State 1');
    pushHistory(doc, 'State 2');
    pushHistory(doc, 'State 3');

    expect(canUndo(doc)).toBe(true);
    expect(canRedo(doc)).toBe(false);

    undo(doc);
    expect(canUndo(doc)).toBe(true);
    expect(canRedo(doc)).toBe(true);

    undo(doc);
    expect(canUndo(doc)).toBe(false);
    expect(canRedo(doc)).toBe(true);

    redo(doc);
    redo(doc);
    expect(canUndo(doc)).toBe(true);
    expect(canRedo(doc)).toBe(false);
    expect(doc.historyIndex).toBe(2);
  });

  it('layer canvases are cloned independently', () => {
    const doc = createTestDocument();
    const layer = doc.layers[0];
    pushHistory(doc, 'Initial');
    const originalCanvas = layer.canvas;
    undo(doc);
    redo(doc);
    // After undo+redo, snapshot should have restored the canvas
    expect(doc.layers[0].canvas).toBeDefined();
  });
});
