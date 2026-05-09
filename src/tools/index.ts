import { BaseTool } from './tool-base';
import { MoveTool } from './move-tool';
import { MarqueeTool } from './marquee-tool';
import { LassoTool } from './lasso-tool';
import { BrushTool } from './brush-tool';
import { EraserTool } from './eraser-tool';
import { EyedropperTool } from './eyedropper-tool';
import { HandTool } from './hand-tool';
import { ZoomTool } from './zoom-tool';
import { CropTool } from './crop-tool';
import { GradientTool } from './gradient-tool';
import { PaintBucketTool } from './paint-bucket-tool';
import { CloneStampTool } from './clone-stamp-tool';

export { BaseTool, type ToolContext } from './tool-base';

export const TOOL_REGISTRY: Record<string, () => BaseTool> = {
  move: () => new MoveTool(),
  'marquee-rect': () => new MarqueeTool(),
  lasso: () => new LassoTool(),
  brush: () => new BrushTool(),
  eraser: () => new EraserTool(),
  eyedropper: () => new EyedropperTool(),
  hand: () => new HandTool(),
  zoom: () => new ZoomTool(),
  crop: () => new CropTool(),
  gradient: () => new GradientTool(),
  'paint-bucket': () => new PaintBucketTool(),
  'clone-stamp': () => new CloneStampTool(),
};

export const TOOL_DEFINITIONS = Object.values(TOOL_REGISTRY).map(factory => factory().definition);

export function createTool(id: string): BaseTool | null {
  const factory = TOOL_REGISTRY[id];
  return factory ? factory() : null;
}
