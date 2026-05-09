import type { Document } from '../types';

function flattenDocumentToCanvas(doc: Document): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = doc.width;
  canvas.height = doc.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = `rgb(${doc.backgroundColor.r},${doc.backgroundColor.g},${doc.backgroundColor.b})`;
  ctx.fillRect(0, 0, doc.width, doc.height);

  for (const layer of doc.layers) {
    if (!layer.visible || !layer.canvas) continue;
    ctx.globalAlpha = layer.opacity / 100;
    ctx.drawImage(layer.canvas, layer.bounds.x, layer.bounds.y);
  }

  return canvas;
}

export function openFile(onOpen: (imageData: ImageData, name: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/jpg,image/webp,image/bmp,image/tiff,image/gif,.psd';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        onOpen(imageData, file.name);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

export function saveAsPng(doc: Document, filename: string): void {
  const canvas = flattenDocumentToCanvas(doc);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function saveAsJpeg(doc: Document, filename: string, quality = 0.9): void {
  const canvas = flattenDocumentToCanvas(doc);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/jpeg', quality);
  link.click();
}

export function exportAsWebP(doc: Document, filename: string, quality = 0.9): void {
  const canvas = flattenDocumentToCanvas(doc);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
  }, 'image/webp', quality);
}
