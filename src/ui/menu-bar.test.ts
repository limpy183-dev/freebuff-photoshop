import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderMenuBar } from './menu-bar';

describe('renderMenuBar', () => {
  let container: HTMLDivElement;
  let callbacks: {
    onNew: ReturnType<typeof vi.fn>;
    onOpen: ReturnType<typeof vi.fn>;
    onSave: ReturnType<typeof vi.fn>;
    onExport: ReturnType<typeof vi.fn>;
    onUndo: ReturnType<typeof vi.fn>;
    onRedo: ReturnType<typeof vi.fn>;
    onCut: ReturnType<typeof vi.fn>;
    onCopy: ReturnType<typeof vi.fn>;
    onPaste: ReturnType<typeof vi.fn>;
    onFill: ReturnType<typeof vi.fn>;
    onStroke: ReturnType<typeof vi.fn>;
    onPreferences: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    container = document.createElement('div');
    callbacks = {
      onNew: vi.fn(),
      onOpen: vi.fn(),
      onSave: vi.fn(),
      onExport: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      onCut: vi.fn(),
      onCopy: vi.fn(),
      onPaste: vi.fn(),
      onFill: vi.fn(),
      onStroke: vi.fn(),
      onPreferences: vi.fn(),
    };
  });

  it('renders all menu categories', () => {
    renderMenuBar(container, callbacks);
    const menuBtns = container.querySelectorAll('.fb-menu-btn');
    const labels = Array.from(menuBtns).map(b => b.textContent);
    expect(labels.some(l => l?.includes('File'))).toBe(true);
    expect(labels.some(l => l?.includes('Edit'))).toBe(true);
    expect(labels.some(l => l?.includes('Image'))).toBe(true);
    expect(labels.some(l => l?.includes('Layer'))).toBe(true);
    expect(labels.some(l => l?.includes('Select'))).toBe(true);
    expect(labels.some(l => l?.includes('Filter'))).toBe(true);
    expect(labels.some(l => l?.includes('View'))).toBe(true);
    expect(labels.some(l => l?.includes('Window'))).toBe(true);
    expect(labels.some(l => l?.includes('Help'))).toBe(true);
  });

  it('renders File menu items', () => {
    renderMenuBar(container, callbacks);
    const fileBtn = Array.from(container.querySelectorAll('.fb-menu-btn')).find(b => b.textContent?.includes('File'))!;
    const dropdown = fileBtn.querySelector('.fb-menu-dropdown')!;
    const items = dropdown.querySelectorAll('.fb-menu-item');
    const labels = Array.from(items).map(i => i.textContent);
    expect(labels.some(l => l?.includes('New...'))).toBe(true);
    expect(labels.some(l => l?.includes('Open...'))).toBe(true);
    expect(labels.some(l => l?.includes('Save') && !l?.includes('As'))).toBe(true);
    expect(labels.some(l => l?.includes('Save As...'))).toBe(true);
    expect(labels.some(l => l?.includes('Export As...'))).toBe(true);
  });

  it('renders Edit menu items', () => {
    renderMenuBar(container, callbacks);
    const editBtn = Array.from(container.querySelectorAll('.fb-menu-btn')).find(b => b.textContent?.includes('Edit'))!;
    const dropdown = editBtn.querySelector('.fb-menu-dropdown')!;
    const items = dropdown.querySelectorAll('.fb-menu-item');
    const labels = Array.from(items).map(i => i.textContent);
    expect(labels.some(l => l?.includes('Undo'))).toBe(true);
    expect(labels.some(l => l?.includes('Redo'))).toBe(true);
    expect(labels.some(l => l?.includes('Cut'))).toBe(true);
    expect(labels.some(l => l?.includes('Copy'))).toBe(true);
    expect(labels.some(l => l?.includes('Paste'))).toBe(true);
    expect(labels.some(l => l?.includes('Fill...'))).toBe(true);
    expect(labels.some(l => l?.includes('Stroke...'))).toBe(true);
    expect(labels.some(l => l?.includes('Preferences'))).toBe(true);
  });

  it('renders menu item shortcuts', () => {
    renderMenuBar(container, callbacks);
    const fileBtn = Array.from(container.querySelectorAll('.fb-menu-btn')).find(b => b.textContent?.includes('File'))!;
    const dropdown = fileBtn.querySelector('.fb-menu-dropdown')!;
    const newItem = Array.from(dropdown.querySelectorAll('.fb-menu-item')).find(i => i.textContent?.includes('New...'))!;
    expect(newItem.innerHTML).toContain('Ctrl+N');
  });

  it('calls onNew when New menu item clicked', () => {
    renderMenuBar(container, callbacks);
    const fileBtn = Array.from(container.querySelectorAll('.fb-menu-btn')).find(b => b.textContent?.includes('File'))!;
    const dropdown = fileBtn.querySelector('.fb-menu-dropdown')!;
    const newItem = Array.from(dropdown.querySelectorAll('.fb-menu-item')).find(i => i.textContent?.includes('New...'))!;
    (newItem as HTMLElement).click();
    expect(callbacks.onNew).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when Save menu item clicked', () => {
    renderMenuBar(container, callbacks);
    const fileBtn = Array.from(container.querySelectorAll('.fb-menu-btn')).find(b => b.textContent?.includes('File'))!;
    const dropdown = fileBtn.querySelector('.fb-menu-dropdown')!;
    const saveItem = Array.from(dropdown.querySelectorAll('.fb-menu-item')).find(i => i.textContent?.includes('Save') && !i.textContent?.includes('As'))!;
    (saveItem as HTMLElement).click();
    expect(callbacks.onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onUndo when Undo menu item clicked', () => {
    renderMenuBar(container, callbacks);
    const editBtn = Array.from(container.querySelectorAll('.fb-menu-btn')).find(b => b.textContent?.includes('Edit'))!;
    const dropdown = editBtn.querySelector('.fb-menu-dropdown')!;
    const undoItem = Array.from(dropdown.querySelectorAll('.fb-menu-item')).find(i => i.textContent?.includes('Undo'))!;
    (undoItem as HTMLElement).click();
    expect(callbacks.onUndo).toHaveBeenCalledTimes(1);
  });

  it('calls onPreferences when Preferences menu item clicked', () => {
    renderMenuBar(container, callbacks);
    const editBtn = Array.from(container.querySelectorAll('.fb-menu-btn')).find(b => b.textContent?.includes('Edit'))!;
    const dropdown = editBtn.querySelector('.fb-menu-dropdown')!;
    const prefItem = Array.from(dropdown.querySelectorAll('.fb-menu-item')).find(i => i.textContent?.includes('Preferences'))!;
    (prefItem as HTMLElement).click();
    expect(callbacks.onPreferences).toHaveBeenCalledTimes(1);
  });

  it('renders submenu items', () => {
    renderMenuBar(container, callbacks);
    const imageBtn = Array.from(container.querySelectorAll('.fb-menu-btn')).find(b => b.textContent?.includes('Image'))!;
    const dropdown = imageBtn.querySelector('.fb-menu-dropdown')!;
    const modeItem = Array.from(dropdown.querySelectorAll('.fb-menu-item')).find(i => i.textContent?.includes('Mode'))!;
    expect(modeItem.classList.contains('has-submenu')).toBe(true);
    const submenu = modeItem.querySelector('.fb-menu-submenu')!;
    expect(submenu).not.toBeNull();
    expect(submenu.textContent).toContain('RGB');
    expect(submenu.textContent).toContain('CMYK');
  });

  it('renders separators', () => {
    renderMenuBar(container, callbacks);
    const fileBtn = Array.from(container.querySelectorAll('.fb-menu-btn')).find(b => b.textContent?.includes('File'))!;
    const dropdown = fileBtn.querySelector('.fb-menu-dropdown')!;
    const separators = dropdown.querySelectorAll('.fb-menu-separator');
    expect(separators.length).toBeGreaterThan(0);
  });
});
