import { vi } from 'vitest';

interface MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function createMockImageData(width: number, height: number): MockImageData {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  };
}

class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  globalAlpha = 1;
  lineWidth = 1;
  lineDashOffset = 0;
  font = '10px sans-serif';
  textAlign: CanvasTextAlign = 'start';
  textBaseline: CanvasTextBaseline = 'alphabetic';
  private _savedStack: Array<Record<string, unknown>> = [];
  private _path: { x: number; y: number }[] = [];
  private _drawCalls: string[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  getDrawCalls(): string[] {
    return this._drawCalls;
  }

  clearRect(x: number, y: number, w: number, h: number): void {
    this._drawCalls.push(`clearRect(${x},${y},${w},${h})`);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this._drawCalls.push(`fillRect(${x},${y},${w},${h})`);
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this._drawCalls.push(`strokeRect(${x},${y},${w},${h})`);
  }

  beginPath(): void {
    this._path = [];
    this._drawCalls.push('beginPath()');
  }

  moveTo(x: number, y: number): void {
    this._path.push({ x, y });
    this._drawCalls.push(`moveTo(${x},${y})`);
  }

  lineTo(x: number, y: number): void {
    this._path.push({ x, y });
    this._drawCalls.push(`lineTo(${x},${y})`);
  }

  closePath(): void {
    this._drawCalls.push('closePath()');
  }

  arc(x: number, y: number, r: number, sAngle: number, eAngle: number): void {
    this._drawCalls.push(`arc(${x},${y},${r},${sAngle},${eAngle})`);
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this._drawCalls.push(`setTransform(${a},${b},${c},${d},${e},${f})`);
  }

  private _lastFillStyle: string | CanvasGradient | CanvasPattern | undefined;

  fill(): void {
    this._lastFillStyle = this.fillStyle;
    this._drawCalls.push('fill()');
  }

  getLastFillStyle(): string | CanvasGradient | CanvasPattern | undefined {
    return this._lastFillStyle;
  }

  stroke(): void {
    this._drawCalls.push('stroke()');
  }

  save(): void {
    this._savedStack.push({
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      globalAlpha: this.globalAlpha,
      lineWidth: this.lineWidth,
      lineDashOffset: this.lineDashOffset,
      font: this.font,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline,
    });
    this._drawCalls.push('save()');
  }

  restore(): void {
    const state = this._savedStack.pop();
    if (state) {
      Object.assign(this, state);
    }
    this._drawCalls.push('restore()');
  }

  drawImage(image: CanvasImageSource, dx: number, dy: number): void;
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
  drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
  drawImage(image: CanvasImageSource, ...args: number[]): void {
    this._drawCalls.push(`drawImage(${args.join(',')})`);
  }

  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
    const gradient = {
      stops: [] as { offset: number; color: string }[],
      addColorStop(offset: number, color: string): void {
        this.stops.push({ offset, color });
      },
    };
    return gradient as unknown as CanvasGradient;
  }

  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
    return this.createRadialGradient(0, 0, 0, 0, 0, 0);
  }

  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    this._drawCalls.push(`getImageData(${sx},${sy},${sw},${sh})`);
    return createMockImageData(sw, sh) as unknown as ImageData;
  }

  putImageData(imagedata: ImageData, dx: number, dy: number): void {
    this._drawCalls.push(`putImageData(${dx},${dy})`);
  }

  fillText(text: string, x: number, y: number): void {
    this._drawCalls.push(`fillText("${text}",${x},${y})`);
  }

  strokeText(text: string, x: number, y: number): void {
    this._drawCalls.push(`strokeText("${text}",${x},${y})`);
  }

  measureText(text: string): TextMetrics {
    return { width: text.length * 6 } as TextMetrics;
  }

  setLineDash(segments: number[]): void {
    this._drawCalls.push(`setLineDash([${segments.join(',')}])`);
  }

  translate(x: number, y: number): void {
    this._drawCalls.push(`translate(${x},${y})`);
  }

  rotate(angle: number): void {
    this._drawCalls.push(`rotate(${angle})`);
  }

  scale(x: number, y: number): void {
    this._drawCalls.push(`scale(${x},${y})`);
  }

  clip(): void {
    this._drawCalls.push('clip()');
  }

  rect(x: number, y: number, w: number, h: number): void {
    this._drawCalls.push(`rect(${x},${y},${w},${h})`);
  }

  createPattern(image: CanvasImageSource, repetition: string): CanvasPattern | null {
    return {} as unknown as CanvasPattern;
  }

  createImageData(width: number, height: number): ImageData;
  createImageData(imagedata: ImageData): ImageData;
  createImageData(arg1: number | ImageData, arg2?: number): ImageData {
    if (typeof arg1 === 'number' && typeof arg2 === 'number') {
      return createMockImageData(arg1, arg2) as unknown as ImageData;
    }
    return createMockImageData(1, 1) as unknown as ImageData;
  }
}

const canvasContextCache = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
const originalGetContext = HTMLCanvasElement.prototype.getContext;

const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
(HTMLCanvasElement.prototype as any).toDataURL = vi.fn(function (this: HTMLCanvasElement, type?: string, quality?: number) {
  return `data:${type || 'image/png'};base64,mock` + (quality !== undefined ? `,q=${quality}` : '');
});

(HTMLCanvasElement.prototype as any).toBlob = vi.fn(function (this: HTMLCanvasElement, callback: BlobCallback | null, type?: string, quality?: number) {
  if (callback) callback(new Blob(['mock'], { type: type || 'image/png' }));
});

(HTMLCanvasElement.prototype as any).getContext = function (
  contextId: string,
  options?: unknown
): RenderingContext | null {
  if (contextId === '2d') {
    let ctx = canvasContextCache.get(this);
    if (!ctx) {
      ctx = new MockCanvasRenderingContext2D(this) as unknown as CanvasRenderingContext2D;
      Object.defineProperty(ctx, 'drawCalls', {
        get() {
          return (ctx as unknown as MockCanvasRenderingContext2D).getDrawCalls();
        },
        configurable: true,
      });
      canvasContextCache.set(this, ctx);
    }
    return ctx;
  }
  return originalGetContext.call(this, contextId, options);
};

if (typeof PointerEvent === 'undefined') {
  (globalThis as Record<string, unknown>).PointerEvent = class PointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly width: number;
    readonly height: number;
    readonly pressure: number;
    readonly tangentialPressure: number;
    readonly tiltX: number;
    readonly tiltY: number;
    readonly twist: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;
    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
      this.pointerId = init?.pointerId ?? 0;
      this.width = init?.width ?? 1;
      this.height = init?.height ?? 1;
      this.pressure = init?.pressure ?? 0;
      this.tangentialPressure = init?.tangentialPressure ?? 0;
      this.tiltX = init?.tiltX ?? 0;
      this.tiltY = init?.tiltY ?? 0;
      this.twist = init?.twist ?? 0;
      this.pointerType = init?.pointerType ?? 'mouse';
      this.isPrimary = init?.isPrimary ?? false;
    }
  };
}

if (typeof ImageData === 'undefined') {
  (globalThis as Record<string, unknown>).ImageData = class ImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly colorSpace: PredefinedColorSpace;
    constructor(arg1: Uint8ClampedArray | number, arg2: number, arg3?: number | PredefinedColorSpace, settings?: ImageDataSettings) {
      if (typeof arg1 === 'number') {
        this.width = arg1;
        this.height = arg2 as number;
        this.data = new Uint8ClampedArray(arg1 * (arg2 as number) * 4);
      } else {
        this.data = arg1;
        this.width = arg2;
        this.height = (arg3 as number) ?? Math.floor(arg1.length / 4 / arg2);
      }
      this.colorSpace = (settings?.colorSpace ?? 'srgb') as PredefinedColorSpace;
    }
  };
}

if (typeof (globalThis as any).URL === 'undefined' || !(globalThis as any).URL.createObjectURL) {
  (globalThis as any).URL = {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  };
}

if (typeof globalThis.requestAnimationFrame === 'undefined' || !vi.isMockFunction(globalThis.requestAnimationFrame)) {
  (globalThis as any).requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    return 1;
  });
  (globalThis as any).cancelAnimationFrame = vi.fn();
}

if (typeof OffscreenCanvas === 'undefined') {
  (globalThis as Record<string, unknown>).OffscreenCanvas = class OffscreenCanvas {
    width: number;
    height: number;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }
    getContext(contextId: string): unknown {
      if (contextId === '2d') {
        return new MockCanvasRenderingContext2D(this as unknown as HTMLCanvasElement);
      }
      return null;
    }
  };
}

HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  width: 100,
  height: 100,
  toJSON: () => '',
}));
