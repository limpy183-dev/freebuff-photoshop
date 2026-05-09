import type { ColorRGB } from '../types';
import { rgbToHex, hexToRgb, rgbToHsv, hsvToRgb } from '../utils';

export function renderColorPicker(container: HTMLElement, currentColor: ColorRGB, onChange: (color: ColorRGB) => void): void {
  const hsv = rgbToHsv(currentColor);

  container.innerHTML = `
    <div class="fb-color-picker">
      <div class="fb-cp-header">Color Picker</div>
      <div class="fb-cp-sv-box" id="fb-sv-box">
        <div class="fb-cp-sv-cursor" id="fb-sv-cursor"></div>
      </div>
      <div class="fb-cp-hue-slider" id="fb-hue-slider">
        <div class="fb-cp-hue-cursor" id="fb-hue-cursor"></div>
      </div>
      <div class="fb-cp-fields">
        <label>H: <input type="number" id="fb-cp-h" value="${Math.round(hsv.h * 360)}"></label>
        <label>S: <input type="number" id="fb-cp-s" value="${Math.round(hsv.s * 100)}"></label>
        <label>B: <input type="number" id="fb-cp-v" value="${Math.round(hsv.v * 100)}"></label>
        <label>R: <input type="number" id="fb-cp-r" value="${Math.round(currentColor.r)}"></label>
        <label>G: <input type="number" id="fb-cp-g" value="${Math.round(currentColor.g)}"></label>
        <label>B: <input type="number" id="fb-cp-b" value="${Math.round(currentColor.b)}"></label>
        <label># <input type="text" id="fb-cp-hex" value="${rgbToHex(currentColor)}"></label>
      </div>
      <div class="fb-cp-preview" id="fb-cp-preview"></div>
      <button class="fb-cp-ok">OK</button>
      <button class="fb-cp-cancel">Cancel</button>
    </div>
  `;

  let h = hsv.h;
  let s = hsv.s;
  let v = hsv.v;

  const updateUI = () => {
    const rgb = hsvToRgb({ h, s, v });
    const preview = container.querySelector('#fb-cp-preview') as HTMLElement;
    if (preview) preview.style.backgroundColor = `rgb(${rgb.r},${rgb.g},${rgb.b})`;

    const svBox = container.querySelector('#fb-sv-box') as HTMLElement;
    if (svBox) svBox.style.backgroundColor = `hsl(${h * 360}, 100%, 50%)`;

    const svCursor = container.querySelector('#fb-sv-cursor') as HTMLElement;
    if (svCursor) {
      svCursor.style.left = `${s * 100}%`;
      svCursor.style.top = `${(1 - v) * 100}%`;
    }

    const hueCursor = container.querySelector('#fb-hue-cursor') as HTMLElement;
    if (hueCursor) hueCursor.style.left = `${h * 100}%`;

    (container.querySelector('#fb-cp-h') as HTMLInputElement).value = String(Math.round(h * 360));
    (container.querySelector('#fb-cp-s') as HTMLInputElement).value = String(Math.round(s * 100));
    (container.querySelector('#fb-cp-v') as HTMLInputElement).value = String(Math.round(v * 100));
    (container.querySelector('#fb-cp-r') as HTMLInputElement).value = String(Math.round(rgb.r));
    (container.querySelector('#fb-cp-g') as HTMLInputElement).value = String(Math.round(rgb.g));
    (container.querySelector('#fb-cp-b') as HTMLInputElement).value = String(Math.round(rgb.b));
    (container.querySelector('#fb-cp-hex') as HTMLInputElement).value = rgbToHex(rgb);

    onChange(rgb);
  };

  const svBox = container.querySelector('#fb-sv-box') as HTMLElement;
  svBox.addEventListener('pointerdown', (e) => {
    const rect = svBox.getBoundingClientRect();
    const update = () => {
      s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
      updateUI();
    };
    update();
  });

  const hueSlider = container.querySelector('#fb-hue-slider') as HTMLElement;
  hueSlider.addEventListener('pointerdown', (e) => {
    const rect = hueSlider.getBoundingClientRect();
    h = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    updateUI();
  });

  container.querySelector('.fb-cp-ok')?.addEventListener('click', () => {
    (container.closest('.fb-modal-overlay') as HTMLElement)?.classList.add('hidden');
  });

  container.querySelector('.fb-cp-cancel')?.addEventListener('click', () => {
    (container.closest('.fb-modal-overlay') as HTMLElement)?.classList.add('hidden');
  });

  updateUI();
}
