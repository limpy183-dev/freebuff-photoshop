import { describe, it, expect } from 'vitest';
import {
  clamp,
  lerp,
  degreesToRadians,
  radiansToDegrees,
  distance,
  roundTo,
  fitRectInside,
} from './math';

describe('clamp', () => {
  it('returns value when inside range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('clamps to min when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, -50, 50)).toBe(-50);
  });

  it('clamps to max when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, -50, 50)).toBe(50);
  });

  it('handles negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-20, -10, -1)).toBe(-10);
  });

  it('handles zero-width range', () => {
    expect(clamp(5, 7, 7)).toBe(7);
  });
});

describe('lerp', () => {
  it('interpolates correctly at boundaries', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
  });

  it('interpolates at midpoints', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });

  it('clamps t outside [0,1]', () => {
    expect(lerp(0, 10, -0.5)).toBe(0);
    expect(lerp(0, 10, 1.5)).toBe(10);
  });

  it('handles negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
    expect(lerp(-10, -5, 0.5)).toBe(-7.5);
  });

  it('handles reversed range', () => {
    expect(lerp(10, 0, 0.5)).toBe(5);
    expect(lerp(10, 0, 0)).toBe(10);
    expect(lerp(10, 0, 1)).toBe(0);
  });
});

describe('degreesToRadians', () => {
  it('converts 0 degrees', () => {
    expect(degreesToRadians(0)).toBe(0);
  });

  it('converts 180 degrees to PI', () => {
    expect(degreesToRadians(180)).toBe(Math.PI);
  });

  it('converts 90 degrees to PI/2', () => {
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 10);
  });

  it('converts 360 degrees to 2*PI', () => {
    expect(degreesToRadians(360)).toBeCloseTo(Math.PI * 2, 10);
  });

  it('converts negative degrees', () => {
    expect(degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2, 10);
  });
});

describe('radiansToDegrees', () => {
  it('converts 0 radians', () => {
    expect(radiansToDegrees(0)).toBe(0);
  });

  it('converts PI to 180', () => {
    expect(radiansToDegrees(Math.PI)).toBe(180);
  });

  it('converts PI/2 to 90', () => {
    expect(radiansToDegrees(Math.PI / 2)).toBe(90);
  });

  it('converts 2*PI to 360', () => {
    expect(radiansToDegrees(Math.PI * 2)).toBe(360);
  });
});

describe('distance', () => {
  it('computes zero distance for same point', () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it('computes horizontal distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
  });

  it('computes vertical distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);
  });

  it('computes diagonal distance (3-4-5 triangle)', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('computes distance with negative coordinates', () => {
    expect(distance({ x: -1, y: -1 }, { x: 2, y: 3 })).toBe(5);
  });

  it('returns float for non-integer distances', () => {
    expect(distance({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(Math.sqrt(2), 10);
  });
});

describe('roundTo', () => {
  it('rounds to 0 decimals', () => {
    expect(roundTo(3.7, 0)).toBe(4);
    expect(roundTo(3.2, 0)).toBe(3);
    expect(roundTo(-3.7, 0)).toBe(-4);
  });

  it('rounds to 1 decimal', () => {
    expect(roundTo(3.75, 1)).toBe(3.8);
    expect(roundTo(3.74, 1)).toBe(3.7);
  });

  it('rounds to 2 decimals', () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(3.145, 2)).toBe(3.15);
  });

  it('handles exact values', () => {
    expect(roundTo(3, 2)).toBe(3);
    expect(roundTo(3.5, 2)).toBe(3.5);
  });

  it('handles negative values', () => {
    expect(roundTo(-2.555, 2)).toBe(-2.56);
  });
});

describe('fitRectInside', () => {
  it('scales down when content is larger', () => {
    const result = fitRectInside(200, 100, 100, 100);
    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
  });

  it('scales down based on height constraint', () => {
    const result = fitRectInside(100, 200, 100, 100);
    expect(result.width).toBe(50);
    expect(result.height).toBe(100);
  });

  it('does not scale up when content is smaller', () => {
    const result = fitRectInside(50, 50, 100, 100);
    expect(result.width).toBe(50);
    expect(result.height).toBe(50);
  });

  it('handles exact fit', () => {
    const result = fitRectInside(100, 100, 100, 100);
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });

  it('handles wide aspect ratios', () => {
    const result = fitRectInside(400, 100, 200, 200);
    expect(result.width).toBe(200);
    expect(result.height).toBe(50);
  });

  it('handles tall aspect ratios', () => {
    const result = fitRectInside(100, 400, 200, 200);
    expect(result.width).toBe(50);
    expect(result.height).toBe(200);
  });

  it('handles zero container dimensions', () => {
    const result = fitRectInside(100, 100, 0, 0);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });
});
