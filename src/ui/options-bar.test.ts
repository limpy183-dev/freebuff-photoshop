import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderOptionsBar } from './options-bar';
import type { ColorRGB, ToolOptions } from '../types';

describe('renderOptionsBar', () => {
  let container: HTMLDivElement;
  let onOptionChange: ReturnType<typeof vi.fn>;
  let onColorChange: ReturnType<typeof vi.fn>;
  let onColorPickerOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    onOptionChange = vi.fn();
    onColorChange = vi.fn();
    onColorPickerOpen = vi.fn();
  });

  it('shows placeholder when no tool selected', () => {
    renderOptionsBar(container, {
      activeToolId: 'nonexistent',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    expect(container.textContent).toContain('Select a tool to see options');
  });

  it('renders tool name for brush', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const title = container.querySelector('.fb-options-title');
    expect(title?.textContent).toBe('Brush Tool');
  });

  it('renders foreground color swatch', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 255, g: 0, b: 0 },
      backgroundColor: { r: 0, g: 0, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const fgSwatch = container.querySelector('.fb-fg-swatch') as HTMLElement;
    expect(fgSwatch).not.toBeNull();
    expect(fgSwatch.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('renders background color swatch', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 255, g: 0, b: 0 },
      backgroundColor: { r: 0, g: 0, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const bgSwatch = container.querySelector('.fb-bg-swatch') as HTMLElement;
    expect(bgSwatch).not.toBeNull();
    expect(bgSwatch.style.backgroundColor).toBe('rgb(0, 0, 255)');
  });

  it('calls onColorPickerOpen when foreground swatch clicked', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const fgSwatch = container.querySelector('.fb-fg-swatch') as HTMLElement;
    fgSwatch.click();
    expect(onColorPickerOpen).toHaveBeenCalledWith('foreground');
  });

  it('calls onColorPickerOpen when background swatch clicked', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const bgSwatch = container.querySelector('.fb-bg-swatch') as HTMLElement;
    bgSwatch.click();
    expect(onColorPickerOpen).toHaveBeenCalledWith('background');
  });

  it('calls onColorChange with swapped colors when swap clicked', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 255, g: 0, b: 0 },
      backgroundColor: { r: 0, g: 0, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const swapBtn = container.querySelector('.fb-swap-colors') as HTMLButtonElement;
    swapBtn.click();
    expect(onColorChange).toHaveBeenCalledTimes(2);
    expect(onColorChange).toHaveBeenNthCalledWith(1, 'foreground', { r: 0, g: 0, b: 255 });
    expect(onColorChange).toHaveBeenNthCalledWith(2, 'background', { r: 255, g: 0, b: 0 });
  });

  it('calls onColorChange with default colors when default clicked', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 128, g: 128, b: 128 },
      backgroundColor: { r: 128, g: 128, b: 128 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const defaultBtn = container.querySelector('.fb-default-colors') as HTMLButtonElement;
    defaultBtn.click();
    expect(onColorChange).toHaveBeenCalledTimes(2);
    expect(onColorChange).toHaveBeenNthCalledWith(1, 'foreground', { r: 0, g: 0, b: 0 });
    expect(onColorChange).toHaveBeenNthCalledWith(2, 'background', { r: 255, g: 255, b: 255 });
  });

  it('renders brush tool options', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const labels = Array.from(container.querySelectorAll('.fb-option-label')).map(l => l.textContent);
    expect(labels).toContain('size');
    expect(labels).toContain('hardness');
    expect(labels).toContain('opacity');
    expect(labels).toContain('flow');
    expect(labels).toContain('spacing');
    expect(labels).toContain('smoothing');
  });

  it('renders range inputs for brush options', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const inputs = container.querySelectorAll('input[type="range"]');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('calls onOptionChange when range input changes', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const sizeInput = Array.from(container.querySelectorAll('.fb-option input')).find(
      input => (input as HTMLElement).parentElement?.querySelector('.fb-option-label')?.textContent === 'size'
    ) as HTMLInputElement;
    expect(sizeInput).not.toBeNull();
    sizeInput.value = '50';
    sizeInput.dispatchEvent(new Event('input'));
    expect(onOptionChange).toHaveBeenCalledWith('brush', 'size', 50);
  });

  it('renders enum options as select elements', () => {
    renderOptionsBar(container, {
      activeToolId: 'gradient',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const selects = container.querySelectorAll('select');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('renders boolean options as checkboxes', () => {
    renderOptionsBar(container, {
      activeToolId: 'gradient',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('updates with new active tool', () => {
    renderOptionsBar(container, {
      activeToolId: 'brush',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    expect(container.querySelector('.fb-options-title')?.textContent).toBe('Brush Tool');
    renderOptionsBar(container, {
      activeToolId: 'eraser',
      toolOptions: {},
      foregroundColor: { r: 0, g: 0, b: 0 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      onOptionChange,
      onColorChange,
      onColorPickerOpen,
    });
    expect(container.querySelector('.fb-options-title')?.textContent).toBe('Eraser Tool');
  });
});
