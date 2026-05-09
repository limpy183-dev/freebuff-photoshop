import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToolbar } from './toolbar';

describe('renderToolbar', () => {
  let container: HTMLDivElement;
  let onToolSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    onToolSelect = vi.fn();
  });

  it('renders all tool buttons', () => {
    renderToolbar(container, { activeToolId: 'move', onToolSelect });
    const buttons = container.querySelectorAll('.fb-tool-btn');
    expect(buttons.length).toBe(20);
  });

  it('marks active tool button', () => {
    renderToolbar(container, { activeToolId: 'brush', onToolSelect });
    const activeBtn = container.querySelector('.fb-tool-btn.active') as HTMLElement;
    expect(activeBtn).not.toBeNull();
    expect(activeBtn.dataset.toolId).toBe('brush');
  });

  it('does not mark inactive tools as active', () => {
    renderToolbar(container, { activeToolId: 'move', onToolSelect });
    const activeBtns = container.querySelectorAll('.fb-tool-btn.active');
    expect(activeBtns.length).toBe(1);
    expect((activeBtns[0] as HTMLElement).dataset.toolId).toBe('move');
  });

  it('calls onToolSelect when button is clicked', () => {
    renderToolbar(container, { activeToolId: 'move', onToolSelect });
    const brushBtn = container.querySelector('[data-tool-id="brush"]') as HTMLButtonElement;
    brushBtn.click();
    expect(onToolSelect).toHaveBeenCalledTimes(1);
    expect(onToolSelect).toHaveBeenCalledWith('brush');
  });

  it('renders tool separators', () => {
    renderToolbar(container, { activeToolId: 'move', onToolSelect });
    const separators = container.querySelectorAll('.fb-tool-sep');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('sets button title to tool name', () => {
    renderToolbar(container, { activeToolId: 'move', onToolSelect });
    const moveBtn = container.querySelector('[data-tool-id="move"]') as HTMLButtonElement;
    expect(moveBtn.title).toBe('Move Tool (V)');
  });

  it('sets button icon text to shortcut', () => {
    renderToolbar(container, { activeToolId: 'move', onToolSelect });
    const moveBtn = container.querySelector('[data-tool-id="move"]') as HTMLButtonElement;
    const icon = moveBtn.querySelector('.fb-tool-icon');
    expect(icon?.textContent).toBe('V');
  });

  it('re-renders with new active tool', () => {
    renderToolbar(container, { activeToolId: 'move', onToolSelect });
    expect(container.querySelector('.fb-tool-btn.active')?.getAttribute('data-tool-id')).toBe('move');
    renderToolbar(container, { activeToolId: 'zoom', onToolSelect });
    expect(container.querySelector('.fb-tool-btn.active')?.getAttribute('data-tool-id')).toBe('zoom');
  });
});
