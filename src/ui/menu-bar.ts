interface MenuCallbacks {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onFill: () => void;
  onStroke: () => void;
  onPreferences: () => void;
}

type MenuAction = keyof MenuCallbacks;

interface MenuItem {
  label?: string;
  shortcut?: string;
  action?: MenuAction | null;
  type?: 'separator';
  submenu?: string[];
}

interface MenuDef {
  label: string;
  items: MenuItem[];
}

const MENUS: MenuDef[] = [
  {
    label: 'File',
    items: [
      { label: 'New...', shortcut: 'Ctrl+N', action: 'onNew' },
      { label: 'Open...', shortcut: 'Ctrl+O', action: 'onOpen' },
      { type: 'separator' },
      { label: 'Save', shortcut: 'Ctrl+S', action: 'onSave' },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: 'onSave' },
      { label: 'Export As...', shortcut: '', action: 'onExport' },
      { type: 'separator' },
      { label: 'Exit', shortcut: '', action: null },
    ],
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: 'onUndo' },
      { label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: 'onRedo' },
      { type: 'separator' },
      { label: 'Cut', shortcut: 'Ctrl+X', action: 'onCut' },
      { label: 'Copy', shortcut: 'Ctrl+C', action: 'onCopy' },
      { label: 'Paste', shortcut: 'Ctrl+V', action: 'onPaste' },
      { type: 'separator' },
      { label: 'Fill...', shortcut: 'Shift+F5', action: 'onFill' },
      { label: 'Stroke...', shortcut: '', action: 'onStroke' },
      { type: 'separator' },
      { label: 'Preferences', shortcut: 'Ctrl+K', action: 'onPreferences' },
    ],
  },
  {
    label: 'Image',
    items: [
      { label: 'Mode', shortcut: '', submenu: ['RGB', 'CMYK', 'Grayscale', 'Lab'] },
      { label: 'Adjustments', shortcut: '', submenu: ['Brightness/Contrast', 'Levels', 'Curves', 'Hue/Saturation', 'Color Balance', 'Black & White'] },
      { label: 'Auto Tone', shortcut: 'Shift+Ctrl+L', action: null },
      { label: 'Auto Contrast', shortcut: 'Alt+Shift+Ctrl+L', action: null },
      { label: 'Auto Color', shortcut: 'Shift+Ctrl+B', action: null },
      { label: 'Image Size...', shortcut: 'Alt+Ctrl+I', action: null },
      { label: 'Canvas Size...', shortcut: 'Alt+Ctrl+C', action: null },
      { label: 'Crop', shortcut: '', action: null },
      { label: 'Trim...', shortcut: '', action: null },
    ],
  },
  {
    label: 'Layer',
    items: [
      { label: 'New Layer', shortcut: 'Shift+Ctrl+N', action: null },
      { label: 'Duplicate Layer', shortcut: 'Ctrl+J', action: null },
      { label: 'Delete Layer', shortcut: '', action: null },
      { type: 'separator' },
      { label: 'Layer Style', shortcut: '', submenu: ['Drop Shadow', 'Inner Shadow', 'Outer Glow', 'Inner Glow', 'Bevel & Emboss', 'Satin', 'Color Overlay', 'Gradient Overlay', 'Pattern Overlay', 'Stroke'] },
      { label: 'Smart Objects', shortcut: '', submenu: ['Convert to Smart Object', 'Edit Contents', 'Replace Contents'] },
      { label: 'New Fill Layer', shortcut: '', submenu: ['Solid Color', 'Gradient', 'Pattern'] },
      { label: 'New Adjustment Layer', shortcut: '', submenu: ['Brightness/Contrast', 'Levels', 'Curves', 'Exposure', 'Hue/Saturation'] },
      { type: 'separator' },
      { label: 'Merge Layers', shortcut: 'Ctrl+E', action: null },
      { label: 'Merge Visible', shortcut: 'Shift+Ctrl+E', action: null },
      { label: 'Flatten Image', shortcut: '', action: null },
    ],
  },
  {
    label: 'Select',
    items: [
      { label: 'All', shortcut: 'Ctrl+A', action: null },
      { label: 'Deselect', shortcut: 'Ctrl+D', action: null },
      { label: 'Reselect', shortcut: 'Shift+Ctrl+D', action: null },
      { label: 'Inverse', shortcut: 'Shift+Ctrl+I', action: null },
      { type: 'separator' },
      { label: 'Color Range...', shortcut: '', action: null },
      { label: 'Select and Mask...', shortcut: 'Alt+Ctrl+R', action: null },
      { label: 'Modify', shortcut: '', submenu: ['Border', 'Smooth', 'Expand', 'Contract', 'Feather'] },
    ],
  },
  {
    label: 'Filter',
    items: [
      { label: 'Last Filter', shortcut: 'Ctrl+F', action: null },
      { label: 'Convert for Smart Filters', shortcut: '', action: null },
      { type: 'separator' },
      { label: 'Filter Gallery...', shortcut: '', action: null },
      { label: 'Camera Raw Filter...', shortcut: 'Shift+Ctrl+A', action: null },
      { label: 'Liquify...', shortcut: 'Shift+Ctrl+X', action: null },
      { label: 'Vanishing Point...', shortcut: 'Alt+Ctrl+V', action: null },
      { type: 'separator' },
      { label: 'Blur', shortcut: '', submenu: ['Average', 'Blur', 'Blur More', 'Box Blur', 'Gaussian Blur', 'Lens Blur', 'Motion Blur', 'Radial Blur', 'Shape Blur', 'Smart Blur', 'Surface Blur'] },
      { label: 'Sharpen', shortcut: '', submenu: ['Sharpen', 'Sharpen Edges', 'Sharpen More', 'Smart Sharpen', 'Unsharp Mask'] },
      { label: 'Noise', shortcut: '', submenu: ['Add Noise', 'Despeckle', 'Dust & Scratches', 'Median', 'Reduce Noise'] },
      { label: 'Distort', shortcut: '', submenu: ['Displace', 'Pinch', 'Polar Coordinates', 'Ripple', 'Shear', 'Spherize', 'Twirl', 'Wave', 'ZigZag'] },
      { label: 'Stylize', shortcut: '', submenu: ['Diffuse', 'Emboss', 'Extrude', 'Find Edges', 'Glowing Edges', 'Solarize', 'Tiles', 'Trace Contour', 'Wind'] },
      { label: 'Pixelate', shortcut: '', submenu: ['Color Halftone', 'Crystallize', 'Facet', 'Fragment', 'Mezzotint', 'Mosaic', 'Pointillize'] },
      { label: 'Render', shortcut: '', submenu: ['Clouds', 'Difference Clouds', 'Fibers', 'Lens Flare', 'Lighting Effects'] },
    ],
  },
  {
    label: 'View',
    items: [
      { label: 'Proof Colors', shortcut: 'Ctrl+Y', action: null },
      { label: 'Zoom In', shortcut: 'Ctrl++', action: null },
      { label: 'Zoom Out', shortcut: 'Ctrl+-', action: null },
      { label: 'Fit on Screen', shortcut: 'Ctrl+0', action: null },
      { label: 'Actual Pixels', shortcut: 'Ctrl+1', action: null },
      { type: 'separator' },
      { label: 'Extras', shortcut: 'Ctrl+H', action: null },
      { label: 'Show', shortcut: '', submenu: ['Grid', 'Guides', 'Slices', 'Selection Edges', 'Target Path', 'Annotations', 'Layer Edges', 'Smart Guides'] },
      { label: 'Rulers', shortcut: 'Ctrl+R', action: null },
      { label: 'Snap', shortcut: 'Shift+Ctrl+;', action: null },
    ],
  },
  {
    label: 'Window',
    items: [
      { label: 'Workspace', shortcut: '', submenu: ['Essentials', '3D', 'Graphic and Web', 'Motion', 'Painting', 'Photography', 'Reset Essentials'] },
      { type: 'separator' },
      { label: 'Actions', shortcut: 'Alt+F9', action: null },
      { label: 'Layers', shortcut: 'F7', action: null },
      { label: 'Channels', shortcut: '', action: null },
      { label: 'Paths', shortcut: '', action: null },
      { label: 'Properties', shortcut: '', action: null },
      { label: 'History', shortcut: '', action: null },
      { label: 'Info', shortcut: 'F8', action: null },
      { label: 'Navigator', shortcut: '', action: null },
      { label: 'Swatches', shortcut: '', action: null },
      { label: 'Color', shortcut: 'F6', action: null },
      { label: 'Character', shortcut: '', action: null },
    ],
  },
  {
    label: 'Help',
    items: [
      { label: 'Photoshop Help', shortcut: 'F1', action: null },
      { label: 'About Photoshop', shortcut: '', action: null },
    ],
  },
];

export function renderMenuBar(container: HTMLElement, callbacks: MenuCallbacks): void {
  container.innerHTML = '';
  container.className = 'fb-menu-bar';

  MENUS.forEach(menuDef => {
    const menuBtn = document.createElement('button');
    menuBtn.className = 'fb-menu-btn';
    menuBtn.textContent = menuDef.label;

    const dropdown = document.createElement('div');
    dropdown.className = 'fb-menu-dropdown';

    menuDef.items.forEach((item: any) => {
      if (item.type === 'separator') {
        const sep = document.createElement('div');
        sep.className = 'fb-menu-separator';
        dropdown.appendChild(sep);
        return;
      }

      const menuItem = document.createElement('div');
      menuItem.className = 'fb-menu-item';

      if (item.submenu) {
        menuItem.className += ' has-submenu';
        menuItem.innerHTML = `<span>${item.label}</span><span class="fb-menu-arrow">▶</span>`;

        const subDropdown = document.createElement('div');
        subDropdown.className = 'fb-menu-submenu';
        item.submenu.forEach((subLabel: string) => {
          const subItem = document.createElement('div');
          subItem.className = 'fb-menu-item';
          subItem.textContent = subLabel;
          subDropdown.appendChild(subItem);
        });
        menuItem.appendChild(subDropdown);
      } else {
        menuItem.innerHTML = `<span>${item.label}</span>${item.shortcut ? `<span class="fb-menu-shortcut">${item.shortcut}</span>` : ''}`;
        if (item.action && item.action in callbacks) {
          const action = item.action;
          menuItem.addEventListener('click', () => {
            ((callbacks as unknown) as Record<string, () => void>)[action]();
            closeAllMenus();
          });
        }
      }

      dropdown.appendChild(menuItem);
    });

    menuBtn.appendChild(dropdown);
    container.appendChild(menuBtn);

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      closeAllMenus();
      if (!isOpen) dropdown.classList.add('open');
    });
  });

  document.addEventListener('click', closeAllMenus);
}

function closeAllMenus(): void {
  document.querySelectorAll('.fb-menu-dropdown.open').forEach(el => el.classList.remove('open'));
}
