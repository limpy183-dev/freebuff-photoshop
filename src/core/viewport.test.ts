import { describe, it, expect } from 'vitest';
import {
  createViewport,
  setZoom,
  setPan,
  zoomToFit,
  zoomTo100,
  panBy,
} from './viewport';
import type { ViewportState } from '../types';

describe('createViewport', () => {
  it('returns default viewport state', () => {
    const vp = createViewport();
    expect(vp.zoom).toBe(1);
    expect(vp.panX).toBe(0);
    expect(vp.panY).toBe(0);
    expect(vp.rotation).toBe(0);
  });
});

describe('setZoom', () => {
  it('sets zoom within range', () => {
    const vp = createViewport();
    setZoom(vp, 2);
    expect(vp.zoom).toBe(2);
  });

  it('clamps zoom below minimum', () => {
    const vp = createViewport();
    setZoom(vp, 0.001);
    expect(vp.zoom).toBe(0.01);
  });

  it('clamps zoom above maximum', () => {
    const vp = createViewport();
    setZoom(vp, 200);
    expect(vp.zoom).toBe(128);
  });

  it('allows exact boundary values', () => {
    const vp = createViewport();
    setZoom(vp, 0.01);
    expect(vp.zoom).toBe(0.01);
    setZoom(vp, 128);
    expect(vp.zoom).toBe(128);
  });

  it('mutates the passed viewport', () => {
    const vp = createViewport();
    const returned = setZoom(vp, 5);
    // setZoom returns void, but vp should be mutated
    expect(vp.zoom).toBe(5);
  });
});

describe('setPan', () => {
  it('sets pan values directly', () => {
    const vp = createViewport();
    setPan(vp, 100, -50);
    expect(vp.panX).toBe(100);
    expect(vp.panY).toBe(-50);
  });

  it('overwrites previous pan values', () => {
    const vp = createViewport();
    setPan(vp, 10, 20);
    setPan(vp, 30, 40);
    expect(vp.panX).toBe(30);
    expect(vp.panY).toBe(40);
  });
});

describe('zoomToFit', () => {
  it('fits a larger document into a smaller container', () => {
    const vp = createViewport();
    zoomToFit(vp, 200, 100, 100, 100);
    // padding=40, availableW=20, availableH=20
    // zoom=min(20/200, 20/100, 1)=min(0.1, 0.2, 1)=0.1
    expect(vp.zoom).toBe(0.1);
    expect(vp.panX).toBe(40); // (100 - 200*0.1)/2 = 80/2 = 40
    expect(vp.panY).toBe(45); // (100 - 100*0.1)/2 = 90/2 = 45
  });

  it('fits a tall document', () => {
    const vp = createViewport();
    zoomToFit(vp, 100, 200, 100, 100);
    // zoom=min(20/100, 20/200, 1)=0.1
    expect(vp.zoom).toBe(0.1);
  });

  it('does not zoom beyond 1x for small documents', () => {
    const vp = createViewport();
    // 10x10 doc fits easily in 100x100 even with padding
    zoomToFit(vp, 10, 10, 100, 100);
    // zoom=min(20/10, 20/10, 1)=min(2, 2, 1)=1
    expect(vp.zoom).toBe(1);
    expect(vp.panX).toBe(45); // (100 - 10)/2
    expect(vp.panY).toBe(45);
  });

  it('centers the document', () => {
    const vp = createViewport();
    zoomToFit(vp, 100, 100, 200, 200);
    expect(vp.zoom).toBe(1);
    expect(vp.panX).toBe(50); // (200 - 100*1)/2 = 50
    expect(vp.panY).toBe(50);
  });
});

describe('zoomTo100', () => {
  it('sets zoom to exactly 1', () => {
    const vp = createViewport();
    setZoom(vp, 2);
    zoomTo100(vp, 200, 100);
    expect(vp.zoom).toBe(1);
  });

  it('centers horizontally', () => {
    const vp = createViewport();
    zoomTo100(vp, 200, 100);
    expect(vp.panX).toBe(50); // (200 - 100)/2
  });

  it('does not modify panY', () => {
    const vp = createViewport();
    setPan(vp, 0, 25);
    zoomTo100(vp, 200, 100);
    expect(vp.panY).toBe(25);
  });
});

describe('panBy', () => {
  it('adds to current pan values', () => {
    const vp = createViewport();
    setPan(vp, 10, 20);
    panBy(vp, 5, -3);
    expect(vp.panX).toBe(15);
    expect(vp.panY).toBe(17);
  });

  it('works from default origin', () => {
    const vp = createViewport();
    panBy(vp, 100, 200);
    expect(vp.panX).toBe(100);
    expect(vp.panY).toBe(200);
  });

  it('accumulates multiple pans', () => {
    const vp = createViewport();
    panBy(vp, 10, 10);
    panBy(vp, 20, 30);
    panBy(vp, -5, 0);
    expect(vp.panX).toBe(25);
    expect(vp.panY).toBe(40);
  });
});
