import type { ColorRGB, ColorRGBA } from '../types';

export function rgbToHex({ r, g, b }: ColorRGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;
}

export function hexToRgb(hex: string): ColorRGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHsv({ r, g, b }: ColorRGB): { h: number; s: number; v: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, v };
}

export function hsvToRgb({ h, s, v }: { h: number; s: number; v: number }): ColorRGB {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const vi = v * 255;

  switch (i % 6) {
    case 0: return { r: vi, g: t * 255, b: p * 255 };
    case 1: return { r: q * 255, g: vi, b: p * 255 };
    case 2: return { r: p * 255, g: vi, b: t * 255 };
    case 3: return { r: p * 255, g: q * 255, b: vi };
    case 4: return { r: t * 255, g: p * 255, b: vi };
    case 5: return { r: vi, g: p * 255, b: q * 255 };
  }
  return { r: 0, g: 0, b: 0 };
}

export function rgbToHsl({ r, g, b }: ColorRGB): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r / 255: h = (g / 255 - b / 255) / d + (g < b ? 6 : 0); break;
      case g / 255: h = (b / 255 - r / 255) / d + 2; break;
      case b / 255: h = (r / 255 - g / 255) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: { h: number; s: number; l: number }): ColorRGB {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

export function blendColors(
  base: ColorRGBA,
  over: ColorRGBA,
  mode: string = 'normal'
): ColorRGBA {
  const srcA = over.a / 255;
  const dstA = base.a / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return { r: 0, g: 0, b: 0, a: 0 };

  let r = 0, g = 0, b = 0;

  switch (mode) {
    case 'normal':
      r = over.r;
      g = over.g;
      b = over.b;
      break;
    case 'multiply':
      r = (over.r * base.r) / 255;
      g = (over.g * base.g) / 255;
      b = (over.b * base.b) / 255;
      break;
    case 'screen':
      r = 255 - ((255 - over.r) * (255 - base.r)) / 255;
      g = 255 - ((255 - over.g) * (255 - base.g)) / 255;
      b = 255 - ((255 - over.b) * (255 - base.b)) / 255;
      break;
    case 'overlay':
      r = base.r < 128 ? (2 * over.r * base.r) / 255 : 255 - (2 * (255 - over.r) * (255 - base.r)) / 255;
      g = base.g < 128 ? (2 * over.g * base.g) / 255 : 255 - (2 * (255 - over.g) * (255 - base.g)) / 255;
      b = base.b < 128 ? (2 * over.b * base.b) / 255 : 255 - (2 * (255 - over.b) * (255 - base.b)) / 255;
      break;
    default:
      r = over.r;
      g = over.g;
      b = over.b;
  }

  const outR = (r * srcA + base.r * dstA * (1 - srcA)) / outA;
  const outG = (g * srcA + base.g * dstA * (1 - srcA)) / outA;
  const outB = (b * srcA + base.b * dstA * (1 - srcA)) / outA;

  return {
    r: Math.round(outR),
    g: Math.round(outG),
    b: Math.round(outB),
    a: Math.round(outA * 255),
  };
}

export function luminance({ r, g, b }: ColorRGB): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function grayscale({ r, g, b }: ColorRGB): ColorRGB {
  const l = luminance({ r, g, b });
  return { r: l, g: l, b: l };
}
