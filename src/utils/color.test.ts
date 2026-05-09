import { describe, it, expect } from 'vitest';
import {
  rgbToHex,
  hexToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToHsl,
  hslToRgb,
  blendColors,
  luminance,
  grayscale,
} from './color';
import type { ColorRGB, ColorRGBA } from '../types';

describe('rgbToHex', () => {
  it('converts pure red', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('converts pure green', () => {
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
  });

  it('converts pure blue', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff');
  });

  it('converts black', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
  });

  it('rounds non-integer values', () => {
    expect(rgbToHex({ r: 128.4, g: 128.6, b: 128 })).toBe('#808180');
  });

  it('pads single hex digits', () => {
    expect(rgbToHex({ r: 15, g: 15, b: 15 })).toBe('#0f0f0f');
  });
});

describe('hexToRgb', () => {
  it('parses pure red', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses pure green', () => {
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('parses pure blue', () => {
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('parses black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('parses white', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('handles lowercase hex', () => {
    expect(hexToRgb('#abcdef')).toEqual({ r: 171, g: 205, b: 239 });
  });

  it('handles uppercase hex', () => {
    expect(hexToRgb('#ABCDEF')).toEqual({ r: 171, g: 205, b: 239 });
  });

  it('returns black for invalid hex', () => {
    expect(hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#zzz')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#ff00')).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe('rgbToHsv ↔ hsvToRgb round-trip', () => {
  const colors: ColorRGB[] = [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 0 },
    { r: 0, g: 255, b: 255 },
    { r: 255, g: 0, b: 255 },
    { r: 128, g: 128, b: 128 },
    { r: 255, g: 255, b: 255 },
    { r: 0, g: 0, b: 0 },
    { r: 64, g: 128, b: 192 },
  ];

  it.each(colors)('round-trips %j', (rgb) => {
    const hsv = rgbToHsv(rgb);
    const back = hsvToRgb(hsv);
    expect(back.r).toBeCloseTo(rgb.r, 0);
    expect(back.g).toBeCloseTo(rgb.g, 0);
    expect(back.b).toBeCloseTo(rgb.b, 0);
  });
});

describe('rgbToHsv', () => {
  it('red has hue 0', () => {
    const hsv = rgbToHsv({ r: 255, g: 0, b: 0 });
    expect(hsv.h).toBe(0);
    expect(hsv.s).toBe(1);
    expect(hsv.v).toBe(1);
  });

  it('white has zero saturation', () => {
    const hsv = rgbToHsv({ r: 255, g: 255, b: 255 });
    expect(hsv.s).toBe(0);
    expect(hsv.v).toBe(1);
  });

  it('black has zero value', () => {
    const hsv = rgbToHsv({ r: 0, g: 0, b: 0 });
    expect(hsv.v).toBe(0);
    expect(hsv.s).toBe(0);
  });
});

describe('rgbToHsl ↔ hslToRgb round-trip', () => {
  const colors: ColorRGB[] = [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 0 },
    { r: 0, g: 255, b: 255 },
    { r: 255, g: 0, b: 255 },
    { r: 128, g: 128, b: 128 },
    { r: 255, g: 255, b: 255 },
    { r: 0, g: 0, b: 0 },
    { r: 64, g: 128, b: 192 },
  ];

  it.each(colors)('round-trips %j', (rgb) => {
    const hsl = rgbToHsl(rgb);
    const back = hslToRgb(hsl);
    expect(back.r).toBeCloseTo(rgb.r, 0);
    expect(back.g).toBeCloseTo(rgb.g, 0);
    expect(back.b).toBeCloseTo(rgb.b, 0);
  });
});

describe('blendColors', () => {
  it('fully opaque over fully transparent base replaces base', () => {
    const base: ColorRGBA = { r: 255, g: 0, b: 0, a: 0 };
    const over: ColorRGBA = { r: 0, g: 255, b: 0, a: 255 };
    const result = blendColors(base, over, 'normal');
    expect(result.r).toBe(0);
    expect(result.g).toBe(255);
    expect(result.b).toBe(0);
    expect(result.a).toBe(255);
  });

  it('fully transparent over does nothing', () => {
    const base: ColorRGBA = { r: 255, g: 0, b: 0, a: 255 };
    const over: ColorRGBA = { r: 0, g: 255, b: 0, a: 0 };
    const result = blendColors(base, over, 'normal');
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.a).toBe(255);
  });

  it('50% opacity over blends colors', () => {
    const base: ColorRGBA = { r: 255, g: 0, b: 0, a: 255 };
    const over: ColorRGBA = { r: 0, g: 0, b: 255, a: 128 };
    const result = blendColors(base, over, 'normal');
    // Blending semi-transparent over opaque -> result is fully opaque
    expect(result.a).toBe(255);
    expect(result.r).toBeGreaterThan(0);
    expect(result.r).toBeLessThan(255);
    expect(result.b).toBeGreaterThan(0);
    expect(result.b).toBeLessThan(255);
  });

  it('multiply blend mode darkens', () => {
    const base: ColorRGBA = { r: 255, g: 255, b: 255, a: 255 };
    const over: ColorRGBA = { r: 128, g: 128, b: 128, a: 255 };
    const result = blendColors(base, over, 'multiply');
    expect(result.r).toBe(128);
    expect(result.g).toBe(128);
    expect(result.b).toBe(128);
  });

  it('screen blend mode lightens', () => {
    const base: ColorRGBA = { r: 0, g: 0, b: 0, a: 255 };
    const over: ColorRGBA = { r: 128, g: 128, b: 128, a: 255 };
    const result = blendColors(base, over, 'screen');
    expect(result.r).toBe(128);
    expect(result.g).toBe(128);
    expect(result.b).toBe(128);
  });

  it('returns transparent black for both fully transparent', () => {
    const base: ColorRGBA = { r: 255, g: 255, b: 255, a: 0 };
    const over: ColorRGBA = { r: 0, g: 0, b: 0, a: 0 };
    const result = blendColors(base, over, 'normal');
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.a).toBe(0);
  });

  it('defaults to normal mode when unknown', () => {
    const base: ColorRGBA = { r: 255, g: 0, b: 0, a: 255 };
    const over: ColorRGBA = { r: 0, g: 255, b: 0, a: 255 };
    const result = blendColors(base, over, 'unknown');
    expect(result.r).toBe(0);
    expect(result.g).toBe(255);
    expect(result.b).toBe(0);
    expect(result.a).toBe(255);
  });
});

describe('luminance', () => {
  it('returns 0 for black', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  it('returns 255 for white', () => {
    expect(luminance({ r: 255, g: 255, b: 255 })).toBe(255);
  });

  it('computes weighted sum correctly', () => {
    expect(luminance({ r: 255, g: 0, b: 0 })).toBeCloseTo(76.245, 1);
    expect(luminance({ r: 0, g: 255, b: 0 })).toBeCloseTo(149.685, 1);
    expect(luminance({ r: 0, g: 0, b: 255 })).toBeCloseTo(29.07, 1);
  });
});

describe('grayscale', () => {
  it('returns black for black', () => {
    expect(grayscale({ r: 0, g: 0, b: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns white for white', () => {
    expect(grayscale({ r: 255, g: 255, b: 255 })).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('computes luminance for all channels', () => {
    const gray = grayscale({ r: 255, g: 0, b: 0 });
    expect(gray.r).toBeCloseTo(76.245, 1);
    expect(gray.g).toBe(gray.r);
    expect(gray.b).toBe(gray.r);
  });
});
