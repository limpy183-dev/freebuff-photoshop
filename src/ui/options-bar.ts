import type { ToolDefinition, ToolOptions, ColorRGB } from '../types';
import { TOOL_DEFINITIONS } from '../tools';
import { rgbToHex, hexToRgb } from '../utils';

interface OptionsBarCallbacks {
  activeToolId: string;
  toolOptions: Record<string, ToolOptions>;
  onOptionChange: (toolId: string, key: string, value: number | string | boolean) => void;
  foregroundColor: ColorRGB;
  backgroundColor: ColorRGB;
  onColorChange: (type: 'foreground' | 'background', color: ColorRGB) => void;
  onColorPickerOpen: (type: 'foreground' | 'background') => void;
}

export function renderOptionsBar(container: HTMLElement, callbacks: OptionsBarCallbacks): void {
  container.innerHTML = '';
  container.className = 'fb-options-bar';

  const toolDef = TOOL_DEFINITIONS.find(t => t.id === callbacks.activeToolId);

  if (!toolDef) {
    container.innerHTML = '<span class="fb-options-placeholder">Select a tool to see options</span>';
    return;
  }

  const title = document.createElement('span');
  title.className = 'fb-options-title';
  title.textContent = toolDef.name;
  container.appendChild(title);

  // Color swatches
  const fgSwatch = document.createElement('div');
  fgSwatch.className = 'fb-color-swatch fb-fg-swatch';
  fgSwatch.style.backgroundColor = `rgb(${callbacks.foregroundColor.r},${callbacks.foregroundColor.g},${callbacks.foregroundColor.b})`;
  fgSwatch.title = 'Foreground color';
  fgSwatch.addEventListener('click', () => {
    callbacks.onColorPickerOpen('foreground');
  });

  const bgSwatch = document.createElement('div');
  bgSwatch.className = 'fb-color-swatch fb-bg-swatch';
  bgSwatch.style.backgroundColor = `rgb(${callbacks.backgroundColor.r},${callbacks.backgroundColor.g},${callbacks.backgroundColor.b})`;
  bgSwatch.title = 'Background color';
  bgSwatch.addEventListener('click', () => {
    callbacks.onColorPickerOpen('background');
  });

  const swapBtn = document.createElement('button');
  swapBtn.className = 'fb-swap-colors';
  swapBtn.innerHTML = '⇄';
  swapBtn.title = 'Swap colors (X)';
  swapBtn.addEventListener('click', () => {
    const tmp = callbacks.foregroundColor;
    callbacks.onColorChange('foreground', callbacks.backgroundColor);
    callbacks.onColorChange('background', tmp);
  });

  const defaultBtn = document.createElement('button');
  defaultBtn.className = 'fb-default-colors';
  defaultBtn.innerHTML = 'D';
  defaultBtn.title = 'Default colors (D)';
  defaultBtn.addEventListener('click', () => {
    callbacks.onColorChange('foreground', { r: 0, g: 0, b: 0 });
    callbacks.onColorChange('background', { r: 255, g: 255, b: 255 });
  });

  container.appendChild(fgSwatch);
  container.appendChild(bgSwatch);
  container.appendChild(swapBtn);
  container.appendChild(defaultBtn);

  // Tool options
  toolDef.options.forEach(opt => {
    const opts = callbacks.toolOptions[toolDef.id] ?? {};
    const value = opts[opt.name] ?? opt.default;

    const wrapper = document.createElement('label');
    wrapper.className = 'fb-option';
    wrapper.innerHTML = `<span class="fb-option-label">${opt.name}</span>`;

    if (opt.type === 'range' || opt.type === 'number') {
      const input = document.createElement('input');
      input.type = opt.type === 'range' ? 'range' : 'number';
      input.className = 'fb-option-input';
      if (opt.min !== undefined) input.min = String(opt.min);
      if (opt.max !== undefined) input.max = String(opt.max);
      if (opt.step !== undefined) input.step = String(opt.step);
      input.value = String(value);
      input.addEventListener('input', () => {
        const val = opt.type === 'number' ? parseFloat(input.value) : parseInt(input.value);
        callbacks.onOptionChange(toolDef.id, opt.name, val);
      });
      wrapper.appendChild(input);
    } else if (opt.type === 'boolean') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = value as boolean;
      input.addEventListener('change', () => {
        callbacks.onOptionChange(toolDef.id, opt.name, input.checked);
      });
      wrapper.appendChild(input);
    } else if (opt.type === 'enum') {
      const select = document.createElement('select');
      select.className = 'fb-option-select';
      opt.choices?.forEach(choice => {
        const option = document.createElement('option');
        option.value = choice;
        option.textContent = choice;
        if (choice === value) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener('change', () => {
        callbacks.onOptionChange(toolDef.id, opt.name, select.value);
      });
      wrapper.appendChild(select);
    }

    container.appendChild(wrapper);
  });
}
