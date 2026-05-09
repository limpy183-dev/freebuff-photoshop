import type { Document, Layer } from '../types';
import { getLayerById } from '../core/document';

export function applyGaussianBlur(doc: Document, layerId: string, radius: number): void {
  const layer = getLayerById(doc, layerId);
  if (!layer || !layer.canvas) return;
  const ctx = layer.canvas.getContext('2d')!;
  const w = layer.canvas.width;
  const h = layer.canvas.height;
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);

  const kernel = createGaussianKernel(radius);
  convolveSeparable(src.data, dst.data, w, h, kernel);
  ctx.putImageData(dst, 0, 0);
}

function createGaussianKernel(radius: number): Float32Array {
  const size = Math.ceil(radius * 3) * 2 + 1;
  const kernel = new Float32Array(size);
  const sigma = radius;
  const twoSigma2 = 2 * sigma * sigma;
  let sum = 0;
  const center = Math.floor(size / 2);

  for (let i = 0; i < size; i++) {
    const x = i - center;
    kernel[i] = Math.exp(-(x * x) / twoSigma2);
    sum += kernel[i];
  }

  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }
  return kernel;
}

function convolveSeparable(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  w: number,
  h: number,
  kernel: Float32Array
): void {
  const kLen = kernel.length;
  const kCenter = Math.floor(kLen / 2);
  const temp = new Float32Array(w * h * 4);

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = 0; k < kLen; k++) {
        const sx = Math.min(w - 1, Math.max(0, x + k - kCenter));
        const idx = (y * w + sx) * 4;
        const weight = kernel[k];
        r += src[idx] * weight;
        g += src[idx + 1] * weight;
        b += src[idx + 2] * weight;
        a += src[idx + 3] * weight;
      }
      const dstIdx = (y * w + x) * 4;
      temp[dstIdx] = r;
      temp[dstIdx + 1] = g;
      temp[dstIdx + 2] = b;
      temp[dstIdx + 3] = a;
    }
  }

  // Vertical pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = 0; k < kLen; k++) {
        const sy = Math.min(h - 1, Math.max(0, y + k - kCenter));
        const idx = (sy * w + x) * 4;
        const weight = kernel[k];
        r += temp[idx] * weight;
        g += temp[idx + 1] * weight;
        b += temp[idx + 2] * weight;
        a += temp[idx + 3] * weight;
      }
      const dstIdx = (y * w + x) * 4;
      dst[dstIdx] = Math.round(r);
      dst[dstIdx + 1] = Math.round(g);
      dst[dstIdx + 2] = Math.round(b);
      dst[dstIdx + 3] = Math.round(a);
    }
  }
}

export function applyBrightnessContrast(
  doc: Document,
  layerId: string,
  brightness: number,
  contrast: number
): void {
  const layer = getLayerById(doc, layerId);
  if (!layer || !layer.canvas) return;
  const ctx = layer.canvas.getContext('2d')!;
  const w = layer.canvas.width;
  const h = layer.canvas.height;
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);

  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < src.data.length; i += 4) {
    dst.data[i] = Math.round(factor * (src.data[i] - 128) + 128 + brightness);
    dst.data[i + 1] = Math.round(factor * (src.data[i + 1] - 128) + 128 + brightness);
    dst.data[i + 2] = Math.round(factor * (src.data[i + 2] - 128) + 128 + brightness);
    dst.data[i + 3] = src.data[i + 3];
  }

  ctx.putImageData(dst, 0, 0);
}

export function applyHueSaturation(
  doc: Document,
  layerId: string,
  hue: number,
  saturation: number,
  lightness: number
): void {
  const layer = getLayerById(doc, layerId);
  if (!layer || !layer.canvas) return;
  const ctx = layer.canvas.getContext('2d')!;
  const w = layer.canvas.width;
  const h = layer.canvas.height;
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);

  for (let i = 0; i < src.data.length; i += 4) {
    const r = src.data[i] / 255;
    const g = src.data[i + 1] / 255;
    const b = src.data[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const l = (max + min) / 2;

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    const newH = (h + hue / 360) % 1;
    const newS = Math.max(0, Math.min(1, s * (1 + saturation / 100)));
    const newL = Math.max(0, Math.min(1, l * (1 + lightness / 100)));

    const c = (1 - Math.abs(2 * newL - 1)) * newS;
    const x = c * (1 - Math.abs((newH * 6) % 2 - 1));
    const m = newL - c / 2;
    let nr = 0, ng = 0, nb = 0;

    const hi = Math.floor(newH * 6);
    switch (hi % 6) {
      case 0: nr = c; ng = x; break;
      case 1: nr = x; ng = c; break;
      case 2: ng = c; nb = x; break;
      case 3: ng = x; nb = c; break;
      case 4: nr = x; nb = c; break;
      case 5: nr = c; nb = x; break;
    }

    dst.data[i] = Math.round((nr + m) * 255);
    dst.data[i + 1] = Math.round((ng + m) * 255);
    dst.data[i + 2] = Math.round((nb + m) * 255);
    dst.data[i + 3] = src.data[i + 3];
  }

  ctx.putImageData(dst, 0, 0);
}

export function applyLevels(
  doc: Document,
  layerId: string,
  blackPoint: number,
  gamma: number,
  whitePoint: number
): void {
  const layer = getLayerById(doc, layerId);
  if (!layer || !layer.canvas) return;
  const ctx = layer.canvas.getContext('2d')!;
  const w = layer.canvas.width;
  const h = layer.canvas.height;
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);

  const range = whitePoint - blackPoint;
  if (range <= 0) return;

  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const normalized = (i - blackPoint) / range;
    const corrected = Math.pow(Math.max(0, normalized), 1 / gamma);
    lut[i] = Math.round(Math.max(0, Math.min(255, corrected * 255)));
  }

  for (let i = 0; i < src.data.length; i += 4) {
    dst.data[i] = lut[src.data[i]];
    dst.data[i + 1] = lut[src.data[i + 1]];
    dst.data[i + 2] = lut[src.data[i + 2]];
    dst.data[i + 3] = src.data[i + 3];
  }

  ctx.putImageData(dst, 0, 0);
}
