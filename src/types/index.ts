export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ColorMode = 'rgb' | 'cmyk' | 'grayscale' | 'lab' | 'bitmap' | 'indexed';
export type BitDepth = 8 | 16 | 32;

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorRGBA extends ColorRGB {
  a: number;
}

export interface Document {
  id: string;
  name: string;
  width: number;
  height: number;
  resolution: number;
  colorMode: ColorMode;
  bitDepth: BitDepth;
  layers: Layer[];
  activeLayerId: string | null;
  guides: Guide[];
  history: HistoryState[];
  historyIndex: number;
  selection: Selection | null;
  backgroundColor: ColorRGB;
  viewport?: ViewportState;
}

export type LayerType = 'pixel' | 'adjustment' | 'type' | 'shape' | 'group' | 'smartobject';

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  fillOpacity: number;
  blendMode: BlendMode;
  bounds: Rect;
  canvas: OffscreenCanvas | HTMLCanvasElement | null;
  mask: ImageData | null;
  vectorMask: Path | null;
  effects: LayerEffect[];
  children?: Layer[];
  parentId?: string;
  colorLabel: string;
}

export type BlendMode =
  | 'normal' | 'dissolve'
  | 'darken' | 'multiply' | 'colorburn' | 'linearburn' | 'darkercolor'
  | 'lighten' | 'screen' | 'colordodge' | 'lineardodge' | 'lightercolor'
  | 'overlay' | 'softlight' | 'hardlight' | 'vividlight' | 'linearlight' | 'pinlight' | 'hardmix'
  | 'difference' | 'exclusion' | 'subtract' | 'divide'
  | 'hue' | 'saturation' | 'color' | 'luminosity';

export interface LayerEffect {
  type: 'dropshadow' | 'innerglow' | 'outerglow' | 'bevelemboss' | 'satin' | 'coloroverlay' | 'gradientoverlay' | 'patternoverlay' | 'stroke' | 'innershadow';
  visible: boolean;
  settings: Record<string, unknown>;
}

export interface Guide {
  orientation: 'horizontal' | 'vertical';
  position: number;
}

export interface Selection {
  mask: ImageData;
  feather: number;
  antiAlias: boolean;
}

export type DocumentSnapshot = Omit<Document, 'history' | 'historyIndex' | 'viewport'>;

export interface HistoryState {
  id: string;
  name: string;
  timestamp: number;
  documentSnapshot?: DocumentSnapshot;
  command?: HistoryCommand;
}

export interface HistoryCommand {
  type: string;
  data: unknown;
}

export interface Path {
  id: string;
  name: string;
  segments: PathSegment[];
  closed: boolean;
}

export interface PathSegment {
  type: 'move' | 'line' | 'curve';
  points: Point[];
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
}

export interface ToolOptions {
  [key: string]: number | string | boolean | undefined;
}

export interface ToolDefinition {
  id: string;
  name: string;
  group: string;
  shortcut: string;
  cursor: string;
  options: ToolOptionDef[];
}

export interface ToolOptionDef {
  name: string;
  type: 'number' | 'range' | 'enum' | 'boolean' | 'color';
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  choices?: string[];
}

export interface AppState {
  documents: Document[];
  activeDocumentId: string | null;
  activeToolId: string;
  toolOptions: Record<string, ToolOptions>;
  foregroundColor: ColorRGB;
  backgroundColor: ColorRGB;
  panels: PanelState[];
  workspace: string;
  preferences: Preferences;
  clipboard: ImageData | null;
}

export interface PanelState {
  id: string;
  visible: boolean;
  docked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Preferences {
  historyStates: number;
  autoSave: boolean;
  gridSize: number;
  gridColor: string;
  theme: 'dark' | 'light';
  uiScaling: number;
  performance: {
    cacheLevels: number;
    tileSize: number;
    useGPU: boolean;
  };
}

export type ToolId =
  | 'move' | 'artboard'
  | 'marquee-rect' | 'marquee-ellipse' | 'marquee-single-row' | 'marquee-single-column'
  | 'lasso' | 'lasso-polygonal' | 'lasso-magnetic'
  | 'object-selection' | 'quick-selection' | 'magic-wand'
  | 'crop' | 'perspective-crop' | 'slice' | 'slice-select'
  | 'eyedropper' | 'color-sampler' | 'ruler' | 'note' | 'count'
  | 'spot-healing' | 'healing-brush' | 'patch' | 'content-aware-move' | 'red-eye'
  | 'brush' | 'pencil' | 'color-replacement' | 'mixer-brush'
  | 'clone-stamp' | 'pattern-stamp'
  | 'history-brush' | 'art-history-brush'
  | 'eraser' | 'background-eraser' | 'magic-eraser'
  | 'gradient' | 'paint-bucket'
  | 'blur' | 'sharpen' | 'smudge'
  | 'dodge' | 'burn' | 'sponge'
  | 'pen' | 'freeform-pen' | 'curvature-pen'
  | 'add-anchor' | 'delete-anchor' | 'convert-point'
  | 'horizontal-type' | 'vertical-type'
  | 'path-selection' | 'direct-selection'
  | 'rectangle' | 'rounded-rectangle' | 'ellipse' | 'polygon' | 'line' | 'custom-shape'
  | 'hand' | 'rotate-view' | 'zoom';
