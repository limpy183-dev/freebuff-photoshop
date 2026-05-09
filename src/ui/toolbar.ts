import type { ToolId } from '../types';

interface ToolbarCallbacks {
  activeToolId: string;
  onToolSelect: (id: string) => void;
}

const TOOL_GROUPS = [
  { id: 'move', name: 'Move Tool (V)', shortcut: 'v' },
  { id: 'marquee-rect', name: 'Rectangular Marquee Tool (M)', shortcut: 'm' },
  { id: 'lasso', name: 'Lasso Tool (L)', shortcut: 'l' },
  { id: 'object-selection', name: 'Object Selection Tool', shortcut: '' },
  { id: 'crop', name: 'Crop Tool (C)', shortcut: 'c' },
  { id: 'eyedropper', name: 'Eyedropper Tool (I)', shortcut: 'i' },
  { id: 'spot-healing', name: 'Spot Healing Brush Tool (J)', shortcut: 'j' },
  { id: 'brush', name: 'Brush Tool (B)', shortcut: 'b' },
  { id: 'clone-stamp', name: 'Clone Stamp Tool (S)', shortcut: 's' },
  { id: 'history-brush', name: 'History Brush Tool (Y)', shortcut: 'y' },
  { id: 'eraser', name: 'Eraser Tool (E)', shortcut: 'e' },
  { id: 'gradient', name: 'Gradient Tool (G)', shortcut: 'g' },
  { id: 'blur', name: 'Blur Tool', shortcut: '' },
  { id: 'dodge', name: 'Dodge Tool (O)', shortcut: 'o' },
  { id: 'pen', name: 'Pen Tool (P)', shortcut: 'p' },
  { id: 'horizontal-type', name: 'Horizontal Type Tool (T)', shortcut: 't' },
  { id: 'path-selection', name: 'Path Selection Tool (A)', shortcut: 'a' },
  { id: 'rectangle', name: 'Rectangle Tool (U)', shortcut: 'u' },
  { id: 'hand', name: 'Hand Tool (H)', shortcut: 'h' },
  { id: 'zoom', name: 'Zoom Tool (Z)', shortcut: 'z' },
];

export function renderToolbar(container: HTMLElement, callbacks: ToolbarCallbacks): void {
  container.innerHTML = '';
  container.className = 'fb-toolbar';

  TOOL_GROUPS.forEach((tool, index) => {
    const btn = document.createElement('button');
    btn.className = `fb-tool-btn${callbacks.activeToolId === tool.id ? ' active' : ''}`;
    btn.title = tool.name;
    btn.dataset.toolId = tool.id;

    // Simple icon placeholder using text
    const icon = document.createElement('span');
    icon.className = 'fb-tool-icon';
    icon.textContent = tool.shortcut.toUpperCase() || tool.id[0].toUpperCase();
    btn.appendChild(icon);

    btn.addEventListener('click', () => callbacks.onToolSelect(tool.id));

    container.appendChild(btn);

    // Add separator after certain tools
    if ([0, 1, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 17].includes(index)) {
      const sep = document.createElement('div');
      sep.className = 'fb-tool-sep';
      container.appendChild(sep);
    }
  });
}
