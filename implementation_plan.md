# Comprehensive Implementation Plan: Web-Based Photoshop Clone

---

## Executive Summary

This document outlines a complete implementation plan for building a fully-featured, browser-based Photoshop clone that replicates Adobe Photoshop's UI, functionality, and user experience. The application will be built as a Progressive Web App (PWA) capable of handling professional-grade image editing workflows entirely within the browser.

---

## Table of Contents

1. Project Architecture Overview
2. Technology Stack Selection
3. UI/UX Replication Strategy
4. Core Systems Design
5. Tool Implementation Plan
6. Panel & Workspace System
7. Layer System
8. Color Management System
9. Filter & Adjustment System
10. File Format Support
11. Performance Strategy
12. State Management
13. Keyboard Shortcut System
14. History & Non-Destructive Editing
15. Export & Save System
16. Testing Strategy
17. Phased Rollout Plan
18. Accessibility Considerations
19. Monetization & Licensing Considerations

---

## 1. Project Architecture Overview

### 1.1 High-Level Architecture

The application must be designed as a multi-layered system where each layer has a single, well-defined responsibility. The architecture must prioritize rendering performance above all else, given that image manipulation is computationally intensive.

**Core Architectural Layers:**

- **Presentation Layer** — Handles all DOM rendering, panel layouts, toolbar UI, and user-facing interactions
- **Application Layer** — Manages application state, command routing, tool orchestration, and workspace coordination
- **Domain Layer** — Contains all pure image processing logic, compositing engine, color math, and pixel manipulation algorithms
- **Infrastructure Layer** — Manages file I/O, Web Worker communication, WebAssembly module loading, and browser API abstractions
- **Persistence Layer** — Handles project saving, auto-save, history serialization, and cloud sync

### 1.2 Rendering Architecture

The rendering system must use a multi-canvas approach:

- **Composite Canvas** — The final, merged output visible to the user
- **Working Canvas** — Active tool preview and in-progress stroke rendering
- **Layer Canvases** — Individual off-screen canvases for each layer
- **Cache Canvas** — Pre-composited sections for performance optimization
- **UI Overlay Canvas** — Selection marquees, transform handles, guides, rulers, and crop overlays

### 1.3 Separation of Concerns

Image processing logic must be entirely decoupled from UI rendering. All heavy computation must run in Web Workers. The main thread must only coordinate, display, and respond to input — never block on image processing operations.

---

## 2. Technology Stack Selection

### 2.1 Core Rendering

- **Primary Rendering:** HTML5 Canvas 2D API for layer compositing and basic rendering
- **GPU Acceleration:** WebGL2 for filter operations, blend modes, and large canvas transformations
- **WebGPU (Progressive Enhancement):** For supported browsers, offload complex filter pipelines
- **WebAssembly:** Port critical pixel-level algorithms (Gaussian blur, smart sharpen, liquify mesh deformation) to WASM for near-native performance

### 2.2 Web Workers Strategy

- Dedicated workers for each active filter computation
- Shared worker for layer compositing operations
- Service worker for offline functionality and asset caching
- Transferable objects (ImageBitmap, OffscreenCanvas) must be used to avoid copying pixel data between threads

### 2.3 Framework Considerations

- The UI shell should use a reactive component framework to manage panel state and tool options
- However, the canvas rendering pipeline must remain framework-agnostic and vanilla
- Avoid any virtual DOM diffing in the hot rendering path
- CSS custom properties must drive all theming to allow easy Dark/Light workspace switching

### 2.4 Storage & Persistence

- **IndexedDB** for project file storage, history states, and large asset caching
- **File System Access API** for direct file reading and writing where supported
- **Compression** on all stored image data using efficient binary encoding

---

## 3. UI/UX Replication Strategy

### 3.1 Overall Layout Fidelity

The application must replicate Photoshop's exact spatial layout:

**Layout Regions to Implement:**

- **Application Frame** — Outer chrome, menu bar across the top, title bar with document tabs
- **Options Bar** — Context-sensitive tool options that change based on the active tool, positioned immediately below the menu bar
- **Tools Panel** — Single or double-column panel on the far left with all tool icons organized in Photoshop's exact groupings
- **Workspace Canvas Area** — The central document viewport with zoom controls, scrollbars, and the pasteboard area
- **Panels Dock (Right)** — The collapsible, dockable panel system on the right side
- **Status Bar** — Bottom strip showing document info, zoom level, and tool hints

### 3.2 Dark Theme Replication

Photoshop uses a very specific gray palette. The exact color values for the application's dark theme must be measured and documented:

- **Darkest Background** (application frame, panel backgrounds) — near-black gray
- **Medium Background** (panel headers, docked areas) — medium dark gray
- **Hover States** — slightly lighter than background
- **Active/Selected States** — blue highlight matching Adobe's accent color
- **Icon Colors** — precise gray with white active states
- **Text Colors** — light gray for labels, slightly dimmer for secondary info

### 3.3 Panel System Design

Panels must behave exactly as in Photoshop:

- Panels can be dragged out to float freely
- Panels can be docked into groups (tabbed)
- Panel groups can be docked to edges of the screen
- Panels remember their positions across sessions
- Panels can be collapsed to icon-only mode
- Panel width can be resized by dragging the divider
- Double-clicking a panel header collapses/expands it
- The "Window" menu controls panel visibility

### 3.4 Document Tab System

- Multiple documents open simultaneously as tabs
- Tabs can be dragged to float as separate windows (within the app frame)
- Tab shows document name and modification indicator (asterisk)
- Middle-click to close a tab
- Tab context menu for document operations

---

## 4. Core Systems Design

### 4.1 Document Model

A Document is the central data object representing an open file:

**Document Properties to Track:**
- Unique document ID
- Document name and file path
- Canvas width and height in pixels
- Resolution in pixels per inch
- Color mode (RGB, CMYK, Grayscale, Lab, Bitmap, Indexed Color, Duotone)
- Bit depth (8-bit, 16-bit, 32-bit per channel)
- Color profile embedded ICC profile data
- Layer tree (ordered array of layer objects)
- Guides (horizontal and vertical in document units)
- Grids configuration
- Canvas background color
- Notes and annotations
- History states stack
- Saved state marker for unsaved changes detection

### 4.2 Coordinate Systems

Two coordinate systems must be maintained simultaneously:
- **Canvas Space** — Pixel coordinates within the document
- **Screen Space** — Pixel coordinates on the actual display

All tools must transform between these systems using the current viewport transform (pan offset + zoom scale). Every mouse event must be translated from screen space to canvas space before processing.

### 4.3 Viewport System

The viewport must support:
- Zoom levels from 0.1% to 12,800%
- Smooth zoom with scroll wheel (with accelerator support)
- Pixel-perfect zoom at 100%, 200%, 400%, etc.
- Fit to Screen, Fit to Width, and actual pixel size modes
- Canvas pan via Space+drag (Hand Tool)
- Zoom to a drawn rectangle (Zoom Tool drag)
- Bird's-eye navigator panel showing viewport position
- The canvas area beyond the document edges must show the pasteboard color

---

## 5. Tool Implementation Plan

### 5.1 Tool Architecture

Every tool must follow a consistent interface contract:

**Required Tool Behaviors:**
- Activation and deactivation hooks
- Pointer down, move, and up event handlers
- Options bar configuration declaration
- Cursor definition (custom CSS cursor or canvas-drawn cursor)
- Keyboard shortcut letter assignment
- Tool group membership (for fly-out menus)
- Cancellation handler (Escape key behavior)

### 5.2 Selection Tools

**Rectangular Marquee Tool**
- Draw rectangular selection with click-drag
- Constrain to square with Shift held
- Draw from center with Alt held
- Feather option in options bar
- Anti-aliasing option
- Style option: Normal, Fixed Ratio, Fixed Size
- Adding to selection with Shift
- Subtracting from selection with Alt
- Intersecting with Shift+Alt
- Selection transforms after creation

**Elliptical Marquee Tool**
- All behaviors of Rectangular Marquee
- Constrain to circle with Shift
- Anti-aliasing applied to ellipse boundary

**Single Row Marquee Tool**
- Selects a single horizontal pixel row across full canvas width

**Single Column Marquee Tool**
- Selects a single vertical pixel column across full canvas height

**Lasso Tool**
- Freehand selection drawing
- Release mouse to close selection automatically
- Smooth, anti-aliased selection boundary

**Polygonal Lasso Tool**
- Click to place anchor points
- Double-click or click on origin to close
- Backspace to undo last point
- Snap to 45-degree angles with Shift held

**Magnetic Lasso Tool**
- Edge detection while drawing
- Width, contrast, and frequency options
- Manual anchor placement with click
- Backspace to remove last anchor
- Edge detection algorithm must analyze local pixel contrast

**Object Selection Tool**
- Draw a rough selection, AI refines to object boundaries
- Two modes: Rectangle and Lasso input
- Subtract mode removes detected objects from selection
- This is one of the more complex tools requiring ML-based segmentation or edge-detection heuristics

**Quick Selection Tool**
- Paint to select — expands to nearby similar colors/textures
- Brush size and hardness options
- Add/subtract mode toggle
- Requires flood-fill with edge-awareness algorithm

**Magic Wand Tool**
- Click to select contiguous similarly-colored pixels
- Tolerance setting controls color similarity range
- Anti-alias and contiguous options
- Sample all layers option
- Flood-fill boundary detection algorithm required

### 5.3 Crop & Slice Tools

**Crop Tool**
- Draw crop boundary on image
- Drag handles to resize
- Drag inside to pan
- Rotate crop by dragging outside corners
- Overlay options: Rule of Thirds, Grid, Diagonal, Triangle, Golden Ratio, Golden Spiral
- Straighten mode: draw a line to define horizontal
- Content-aware fill for cropping beyond image boundaries
- Delete cropped pixels or just hide them (non-destructive)
- Aspect ratio presets and custom ratio input

**Perspective Crop Tool**
- Draw a quadrilateral crop region
- Corrects perspective distortion when applied
- Corner handles for four independent points

**Slice Tool**
- Draw rectangular slices over image
- Slices used for web export workflows
- Auto-slices fill remaining space

**Slice Select Tool**
- Select and resize existing slices
- Slice options (name, URL, alt text for web use)

### 5.4 Measurement Tools

**Eyedropper Tool**
- Click to sample color into foreground
- Alt-click to sample into background
- Sample size: point, 3x3 average, 5x5, 11x11, 31x31, 51x51, 101x101
- Sample: current layer, all layers, all layers without adjustments
- Show sampling ring preview

**3D Material Eyedropper** — Sample material properties

**Color Sampler Tool**
- Place up to four persistent sample points
- Info panel shows color values at each point live during edits

**Ruler Tool**
- Draw a measurement line
- Shows length, angle in info panel
- Straighten layer using ruler line
- Clear all rulers

**Note Tool**
- Place sticky note annotations on canvas
- Notes panel shows all notes

**Count Tool**
- Click to place numbered count markers
- Groups of counts tracked separately

### 5.5 Retouching Tools

**Spot Healing Brush Tool**
- Paint over blemishes — automatically samples surrounding texture
- Content-aware mode uses surrounding context for seamless fill
- Type options: Proximity Match, Create Texture, Content-Aware
- Brush size and hardness

**Healing Brush Tool**
- Alt-click to set source point
- Paint to replace target with source texture while matching target tone/color
- Aligned vs non-aligned source option

**Patch Tool**
- Draw freehand selection around damage
- Drag selection to source area to copy texture
- Content-Aware mode
- Source vs Destination mode

**Content-Aware Move Tool**
- Select object and move it
- Fills original location with content-aware fill
- Extend mode stretches rather than moves

**Red Eye Tool**
- Click on red eye to automatically correct
- Pupil size and darken amount options

**Clone Stamp Tool**
- Alt-click to define source point
- Paint to clone from source
- Aligned option keeps relative offset
- Sample options: current layer, current and below, all layers
- Clone Source panel support (up to 5 sources, each with transform)

**Pattern Stamp Tool**
- Paint with a defined pattern
- Impressionist mode option

**Eraser Tool**
- Paint to erase pixels on current layer
- On background layer, fills with background color
- Mode: Brush, Pencil, Block
- Opacity and flow controls

**Background Eraser Tool**
- Samples color at brush center (hotspot)
- Erases pixels matching sampled color within brush
- Limits: Contiguous, Discontiguous, Find Edges
- Tolerance and Protect Foreground Color options

**Magic Eraser Tool**
- Click to erase contiguous similarly-colored pixels (like inverted magic wand)
- Anti-alias, contiguous, sample all layers, opacity options

**Blur Tool**
- Paint to apply progressive blur
- Strength option
- Blurs using local neighborhood averaging

**Sharpen Tool**
- Paint to apply progressive sharpening
- Protect Detail option

**Smudge Tool**
- Smears pixels in paint direction
- Strength option
- Finger Painting mode (paints foreground color into smear)

**Dodge Tool**
- Paint to lighten pixels
- Range: Shadows, Midtones, Highlights
- Exposure amount
- Protect Tones option

**Burn Tool**
- Paint to darken pixels
- Same range and protection options as Dodge

**Sponge Tool**
- Paint to change saturation
- Mode: Saturate / Desaturate
- Flow amount
- Vibrance option

### 5.6 Painting Tools

**Brush Tool**
- The most complex individual tool in the application
- **Brush Tip Options:** Size, Hardness, Roundness, Angle, Spacing
- **Shape Dynamics:** Size jitter, Angle jitter, Roundness jitter — each with control options (Off, Fade, Pen Pressure, Pen Tilt, Stylus Wheel)
- **Scattering:** Scatter amount, Count, Count Jitter
- **Texture:** Pattern selection, Scale, Mode, Depth, Depth Jitter
- **Dual Brush:** Second brush tip layered with first
- **Color Dynamics:** Foreground/Background Jitter, Hue/Saturation/Brightness/Purity jitter
- **Transfer:** Opacity Jitter, Flow Jitter
- **Brush Pose:** Tilt X/Y, Rotation, Pressure
- **Noise:** Adds granular noise to brush stroke
- **Wet Edges:** Builds up paint at edges of stroke
- **Build-up:** Allows cumulative opacity beyond single-pass limit
- **Smoothing:** Intelligent stroke smoothing with several algorithms
- **Protect Texture:** Preserves texture scale across different brushes
- **Opacity:** Overall stroke opacity
- **Flow:** Rate of paint application
- **Airbrush mode:** Continuous paint deposit while holding in place
- **Symmetry Painting:** Axis, Dual Axis, Diagonal, Wavy, Circle, Spiral, Parallel Lines, Radial, Mandala modes

**Pencil Tool**
- Hard-edged brush, same dynamics as Brush
- Auto-Erase: paints background color over foreground color areas

**Color Replacement Tool**
- Paints foreground color while preserving underlying texture/luminosity
- Sampling: Continuous, Once, Background Swatch
- Limits: Contiguous, Discontiguous
- Tolerance, Anti-alias options

**Mixer Brush Tool**
- Simulates physical paint mixing
- Wet, Load, Mix percentage controls
- Load brush with color or canvas sample
- Presets: Dry, Moist, Wet, Very Wet, etc.
- Clean brush and load brush options per stroke

**History Brush Tool**
- Paint from a previous history state
- State source set in History panel

**Art History Brush Tool**
- Paints stylized strokes from history source
- Style options: Tight Short, Tight Medium, Tight Long, Loose Medium, Loose Long, Dab, Light Rough, Heavy Rough, Curl, etc.
- Area, Tolerance, Fidelity options

**Gradient Tool**
- Types: Linear, Radial, Angle, Reflected, Diamond
- Gradient editor with full color stop and opacity stop control
- Gradient presets organized in folders
- Mode and Opacity options
- Reverse, Dither, Transparency options
- On-canvas gradient editing (interactive gradient bar)

**Paint Bucket Tool**
- Fill contiguous area with foreground color or pattern
- Tolerance, Anti-alias, Contiguous, All Layers options

**3D Material Drop Tool** — Apply material to 3D surfaces

### 5.7 Drawing Tools

**Pen Tool**
- Bezier path creation with anchor points and direction handles
- Click for corner points, click-drag for smooth curve points
- Alt-click handle to break handle symmetry
- Rubber band preview option (shows path segment preview before placing point)

**Freeform Pen Tool**
- Draw freehand paths (converted to bezier automatically)
- Magnetic option applies edge detection like Magnetic Lasso

**Curvature Pen Tool**
- Simplified pen where click creates smooth curves automatically
- More intuitive for users unfamiliar with bezier handles

**Add Anchor Point Tool**
- Click on path segment to add new anchor

**Delete Anchor Point Tool**
- Click existing anchor to remove it

**Convert Point Tool**
- Click smooth point to convert to corner
- Click-drag corner point to convert to smooth

**Path Selection Tool (Black Arrow)**
- Select and move entire paths and shapes
- Select multiple paths with Shift
- Align and distribute selected paths

**Direct Selection Tool (White Arrow)**
- Select and move individual anchors and handles
- Marquee-drag to select multiple anchors

**Shape Tools (Rectangle, Rounded Rectangle, Ellipse, Triangle, Polygon, Line, Custom Shape)**
- Draw pixel shapes, path shapes, or vector shape layers
- Pixel mode: fills pixels directly on layer
- Path mode: creates work path
- Shape mode: creates vector shape layer with fill/stroke
- Fill and Stroke options with color, gradient, or pattern
- Stroke width, alignment, caps, corners, and dash pattern
- Shape-specific options (corner radius, number of sides, star ratio, etc.)
- Custom Shape picker with full shape library

### 5.8 Type Tools

**Horizontal Type Tool**
- Click for point text (single line, no wrapping)
- Click-drag for area text (wrapping within bounding box)
- Character formatting: Font family, style, size, tracking, kerning, leading, baseline shift
- Paragraph formatting: Alignment, justification, indent, space before/after paragraph, hyphenation
- Anti-aliasing: None, Sharp, Crisp, Strong, Smooth, LCD, LCD Crisp
- Text color
- Warp text option with styles and bend controls
- OpenType features: Ligatures, Old-Style, Swash, Titling, Ornaments, Ordinals, Fractions, etc.
- Check Spelling
- Find and Replace

**Vertical Type Tool**
- Same as Horizontal but text flows top-to-bottom

**Vertical/Horizontal Type Mask Tools**
- Creates selection in the shape of text rather than a type layer

### 5.9 Navigation Tools

**Hand Tool**
- Click-drag to pan the canvas
- Double-click for Fit to Screen
- Scroll gesture support
- Flick panning with momentum

**Rotate View Tool**
- Rotates the canvas view without affecting document
- Reset View button to return to 0 degrees
- This is a viewport rotation only, not document rotation

**Zoom Tool**
- Click to zoom in centered on click point
- Alt-click to zoom out
- Click-drag to draw zoom rectangle
- Scrubby zoom: drag left/right to zoom out/in
- Options: Resize Windows to Fit, All Windows, Scrubby Zoom

---

## 6. Panel & Workspace System

### 6.1 Core Panels to Implement

**Layers Panel**
- Visual layer stack with thumbnails
- Layer visibility toggle (eye icon)
- Layer lock controls: Lock Transparent Pixels, Lock Image Pixels, Lock Position, Lock Artboard, Lock All
- Layer blend mode dropdown
- Layer opacity slider
- Fill slider (affects layer pixels without affecting layer effects)
- Layer group (folder) expand/collapse
- Layer type icons (pixel, adjustment, type, shape, smart object, video, 3D)
- Active layer highlighting
- Multi-layer selection
- Layer drag-and-drop reordering
- Layer effects (fx) badges
- Smart object badge
- Linked layer chain icon
- Layer search and filtering bar
- Add Layer Mask button
- Add Vector Mask button
- Add Adjustment Layer button
- Group Layers button
- New Layer button
- Delete Layer button
- Panel menu with all layer operations

**Channels Panel**
- RGB composite channel
- Individual Red, Green, Blue channels
- Channel visibility toggle
- Load Channel as Selection
- Save Selection as Channel
- Alpha channels created from selections
- Spot color channels
- Channel thumbnails

**Paths Panel**
- Work Path entry
- Named saved paths
- Path visibility toggle
- Fill Path, Stroke Path, Load Path as Selection, Make Work Path from Selection buttons
- New/Delete path buttons

**History Panel**
- Linear history of all operations
- Current state indicator
- Snapshot thumbnails
- Create new snapshot button
- History source indicator (for History Brush)
- History states displayed as named operation entries

**Actions Panel**
- Action sets as folders
- Individual actions as sequences
- Record, Stop, Play buttons
- New Action and New Set buttons
- Load, Save, Replace Actions
- Button mode for simplified display

**Info Panel**
- Live readout of pixel color at cursor
- Shows before/after values during color adjustments
- X/Y cursor coordinates in chosen units
- Width/Height of selection or transform
- Document size, file size

**Color Panel**
- RGB sliders with value inputs
- Hue Cube, Hue Wheel, Spectrum, Swatches display modes
- Foreground/Background color swatches
- Out-of-gamut and web-safe color warnings

**Swatches Panel**
- Default color swatches
- Custom swatch sets
- Add foreground color as swatch
- Swatch libraries (Pantone, TOYO, FOCOLTONE, etc.)
- Import/Export swatch sets

**Gradients Panel**
- Gradient presets organized in folders
- New Gradient button
- Gradient editor access

**Patterns Panel**
- Pattern presets organized in folders
- New Pattern from selection

**Brushes Panel**
- Brush preset thumbnails or list view
- Search by name
- Folder organization
- Import/Export brushes (.abr format simulation)
- New Brush from settings

**Brush Settings Panel**
- Full brush dynamics editor (Brush Tip Shape, Shape Dynamics, Scattering, Texture, Dual Brush, Color Dynamics, Transfer, Brush Pose, Noise, Wet Edges, Build-up, Smoothing, Protect Texture)
- Brush preview at bottom of panel
- Lock buttons for individual categories

**Character Panel**
- Font family and style dropdowns
- Size, Leading, Kerning, Tracking inputs
- Vertical/Horizontal scale
- Baseline shift
- Color picker
- Anti-aliasing mode
- Faux Bold, Faux Italic, All Caps, Small Caps, Superscript, Subscript, Underline, Strikethrough buttons

**Paragraph Panel**
- Alignment buttons (Left, Center, Right, Justify left, Justify centered, Justify right, Justify all)
- Indent Left Margin, First Line, Right Margin
- Space Before/After Paragraph
- Hyphenate checkbox
- Paragraph composer options

**Character Styles Panel**
- Named text style presets

**Paragraph Styles Panel**
- Named paragraph style presets

**Properties Panel**
- Context-sensitive properties panel
- Document properties when no layer selected
- Layer properties when layer selected
- Shows position, size, transform controls
- Quick access to layer effects toggle
- Alignment and distribution controls
- Live shape properties for vector shapes

**Adjustments Panel**
- Quick-access icons to create all adjustment layer types
- Organized grid of adjustment icons with labels

**Navigator Panel**
- Thumbnail preview of entire document
- Red viewport rectangle shows current visible area
- Drag viewport rectangle to pan
- Zoom slider and percentage input

**Histogram Panel**
- Live histogram of current document
- Channel selector (Composite, Luminosity, R, G, B, Colors)
- Statistics (Mean, Std Dev, Median, Pixels, Cache Level)
- Compact, Expanded, and All Channels views

**Timeline Panel**
- For video and animation workflows
- Frame-based animation for GIF creation
- Video layer timeline
- Playback controls
- Frame duration setting
- Keyframe diamond markers for animated properties

**3D Panel** — 3D scene tree and material editing (lower priority implementation)

**Measurement Log Panel**
- Records measurements from Ruler Tool
- Export to spreadsheet

**Notes Panel**
- List of all notes in document

**Clone Source Panel**
- Up to 5 source points for Clone Stamp and Healing Brush
- Each source can have X/Y offset, W/H scale, and Rotation
- Overlay preview option

**Libraries Panel**
- Connect to stored assets
- Drag assets to canvas
- Linked library assets update when source changes

### 6.2 Workspace Presets

Implement all of Photoshop's built-in workspace presets:
- **Essentials (Default)** — Balanced layout for general use
- **3D** — Panels organized for 3D work
- **Graphic and Web** — Panels for web and graphic design
- **Motion** — Timeline and video-centric layout
- **Painting** — Brushes and color panels prominent
- **Photography** — Adjustment and history panels prominent
- **Typography** — Character and paragraph panels prominent

Custom workspaces must be saveable and deleteable.

---

## 7. Layer System

### 7.1 Layer Types

**Pixel Layer**
- Contains rasterized pixel data
- Can be painted on directly
- Supports transparency (alpha channel)
- Background layer variant: locked transparency, filled with background color

**Adjustment Layer**
- Non-destructive correction applied to all layers beneath
- Has its own layer mask
- Can be clipped to layer below
- Types: Brightness/Contrast, Levels, Curves, Exposure, Vibrance, Hue/Saturation, Color Balance, Black & White, Photo Filter, Channel Mixer, Color Lookup, Invert, Posterize, Threshold, Gradient Map, Selective Color

**Type Layer**
- Contains live, editable text
- Must be rasterized before painting
- Smart rasterization: only convert to pixels when needed for certain operations

**Shape Layer**
- Vector shape with fill and stroke
- Live editable path
- Fill and stroke independent of pixel resolution
- Smart rasterization for filters

**Smart Object Layer**
- Embedded or linked external content
- Non-destructive transformations (scaling never degrades quality)
- Filters applied as Smart Filters (non-destructive, maskable, re-editable)
- Double-click to edit contents in separate document

**Group Layer (Layer Set)**
- Folder containing other layers
- Blend mode applied to merged group result
- Group mask clips all children
- Nested groups supported to unlimited depth

**Video Layer**
- Embedded video file frames
- Playback and frame navigation

**3D Layer**
- Contains 3D scene data

### 7.2 Layer Properties

Each layer must track:
- Unique ID
- Name (editable by double-clicking)
- Visibility state
- Locked flags (position, pixels, transparency, all)
- Blend mode
- Opacity (0-100%)
- Fill opacity (0-100%) — affects pixels but not layer effects
- Layer mask (pixel data + enable/disable + invert)
- Vector mask (path data)
- Layer effects list
- Clipping mask status
- Smart Object source reference
- Layer color label
- Layer thumbnail cache

### 7.3 Layer Blend Modes

All 27 Photoshop blend modes must be implemented with mathematically correct formulas:

**Normal Group:** Normal, Dissolve
**Darken Group:** Darken, Multiply, Color Burn, Linear Burn, Darker Color
**Lighten Group:** Lighten, Screen, Color Dodge, Linear Dodge (Add), Lighter Color
**Contrast Group:** Overlay, Soft Light, Hard Light, Vivid Light, Linear Light, Pin Light, Hard Mix
**Inversion Group:** Difference, Exclusion, Subtract, Divide
**Component Group:** Hue, Saturation, Color, Luminosity

Each blend mode formula must be applied at the per-pixel level during compositing. GPU shaders (WebGL/WebGPU) are preferred for blend mode computation on large canvases.

### 7.4 Layer Effects (Layer Styles)

Each layer can have multiple non-destructive effects applied:

**Effects to Implement:**
- **Drop Shadow** — Color, opacity, angle, distance, spread, size, contour, noise, layer knocks out shadow
- **Inner Shadow** — Same parameters but shadow appears inside layer contents
- **Outer Glow** — Color or gradient glow outside layer, technique, spread, size, contour, range, jitter
- **Inner Glow** — Glow inside layer contents, source (center or edge)
- **Bevel and Emboss** — Style (Outer Bevel, Inner Bevel, Emboss, Pillow Emboss, Stroke Emboss), technique, depth, direction, size, soften, angle, altitude, gloss contour, highlight/shadow mode, opacity
- **Contour** — Shaping the tonal falloff in the bevel/emboss
- **Texture** — Apply pattern texture to bevel/emboss depth
- **Satin** — Creates satin-like interior shading
- **Color Overlay** — Fills layer with a solid color
- **Gradient Overlay** — Fills layer with a gradient
- **Pattern Overlay** — Fills layer with a tiling pattern
- **Stroke** — Outlines layer with color, gradient, or pattern; inside, outside, or center alignment

Layer effects must be composited in the correct order per Photoshop's rendering specification. Effects are linked to the layer and move/transform with it.

---

## 8. Color Management System

### 8.1 Color Modes

**RGB Mode**
- Standard mode for screen output
- 8-bit (0-255 per channel), 16-bit, and 32-bit (HDR) variants
- All tools and filters must operate in this mode

**CMYK Mode**
- For print output preparation
- 8-bit and 16-bit variants
- Color conversion from RGB using ICC profiles
- Soft proofing of CMYK output in RGB display

**Grayscale Mode**
- Single channel luminosity
- Convert from RGB using luminosity weighting

**Lab Color Mode**
- Device-independent color space
- L channel (Lightness), a channel (green-red), b channel (blue-yellow)
- Useful for certain color adjustment techniques

**Bitmap Mode**
- Pure black and white, 1-bit per pixel
- Multiple conversion methods: 50% Threshold, Pattern Dither, Diffusion Dither, Halftone Screen, Custom Pattern

**Indexed Color**
- 256 color palette (GIF-style)
- Color table management
- Web palette and perceptual/adaptive/selective quantization

### 8.2 Bit Depth

- **8-bit per channel** — Standard mode, 256 values per channel
- **16-bit per channel** — High precision for photography editing, 65,536 values per channel, some tools restricted
- **32-bit per channel** — HDR mode, floating-point values, unbounded luminosity range

### 8.3 Color Profiles & ICC Management

- Embed ICC profile in saved files
- Convert between profiles with rendering intent options (Perceptual, Relative Colorimetric, Saturation, Absolute Colorimetric)
- Assign profile without conversion
- Soft Proofing mode simulates output on specified profile
- sRGB, Adobe RGB (1998), ProPhoto RGB as built-in profiles
- Load additional ICC profiles from system

### 8.4 Foreground/Background Color

- Two color wells in the toolbox
- Click to open Color Picker
- Swap button (X key)
- Reset to black/white (D key)
- Color Picker must be a faithful HTML modal implementation of Photoshop's color picker dialog

**Color Picker Dialog Features:**
- Large hue+saturation/brightness square picker
- Hue slider
- Hex input field
- RGB input fields
- HSB input fields
- Lab input fields
- CMYK input fields
- Color swatch showing current vs new color
- Out-of-gamut warning with nearest in-gamut alternative
- Web-safe color warning
- Only Web Colors checkbox

---

## 9. Filter & Adjustment System

### 9.1 Filter Menu Categories

**Blur Filters**
- Average, Blur, Blur More (simple box blur variants)
- Gaussian Blur — standard deviation radius input
- Box Blur — radius input
- Motion Blur — angle and distance
- Radial Blur — amount, method (Spin/Zoom), quality
- Shape Blur — use shape as blur kernel
- Surface Blur — radius and threshold for edge-preserving blur
- Lens Blur — depth map, iris shape, specular highlight controls
- Smart Blur — radius, threshold, mode, quality
- Field Blur, Iris Blur, Tilt-Shift — Blur Gallery filters with on-canvas control points

**Sharpen Filters**
- Sharpen, Sharpen Edges, Sharpen More — non-configurable quick sharpen
- Unsharp Mask — Amount, Radius, Threshold
- Smart Sharpen — Amount, Radius, Remove (Gaussian/Lens Blur/Motion Blur), Angle, Reduce Noise, Shadows/Highlights detail controls

**Noise Filters**
- Add Noise — Amount, Distribution (Uniform/Gaussian), Monochromatic
- Despeckle — Removes noise while preserving edges
- Dust & Scratches — Radius, Threshold
- Median — Radius
- Reduce Noise — Strength, Preserve Details, Reduce Color Noise, Sharpen Details

**Distort Filters**
- Displace — Scale, Displacement Map selection
- Lens Correction — Full dialog with geometric distortion, chromatic aberration, vignette correction
- Pinch — Amount
- Polar Coordinates — Rectangular to Polar, Polar to Rectangular
- Ripple — Amount, Size
- Shear — Define curve distortion, wrap/repeat edge
- Spherize — Amount, Mode
- Twirl — Angle
- Wave — Number of Generators, Wavelength, Amplitude, Scale, Type, Undefined Areas handling
- ZigZag — Amount, Ridges, Style

**Stylize Filters**
- Diffuse — Normal, Darken Only, Lighten Only, Anisotropic
- Emboss — Angle, Height, Amount
- Extrude — Type, Size, Depth
- Find Edges — no parameters
- Glowing Edges — Edge Width, Brightness, Smoothness
- Solarize — no parameters
- Tiles — Number of Tiles, Maximum Offset, Fill Empty Area
- Trace Contour — Level, Edge (Lower/Upper)
- Wind — Method, Direction

**Pixelate Filters**
- Color Halftone — Max Radius, channel angles
- Crystallize — Cell Size
- Facet — no parameters
- Fragment — no parameters
- Mezzotint — Type
- Mosaic — Cell Size
- Pointillize — Cell Size

**Render Filters**
- Clouds — random cloud texture using foreground/background colors
- Difference Clouds — subtract cloud render from layer
- Fibers — Variance, Strength
- Lens Flare — Brightness, Flare Center, Lens Type
- Lighting Effects — multiple light types (Point, Spot, Infinite), surface properties, texture channel

**Other Filters**
- Custom — Define custom convolution kernel (matrix of values)
- High Pass — Radius
- Maximum — Radius, Preserve (Squareness/Roundness)
- Minimum — Same as Maximum
- Offset — Horizontal/Vertical pixel shift, undefined areas handling

**Filter Gallery**
- A modal interface showing the canvas on the left and categorized filters on the right
- Multiple filters can be stacked and reordered in the gallery
- Categories: Artistic, Brush Strokes, Distort, Sketch, Stylize, Texture
- Live preview of filter stack applied to canvas
- Must contain all sub-filters Photoshop includes in each gallery category

**Camera Raw Filter**
- A comprehensive raw processing dialog
- Basic panel: White Balance, Temperature, Tint, Exposure, Contrast, Highlights, Shadows, Whites, Blacks, Clarity, Dehaze, Vibrance, Saturation
- Tone Curve panel: Parametric and Point curve editors
- Detail panel: Sharpening and Noise Reduction
- HSL/Color panel: Hue, Saturation, Luminance per color range
- Color Grading panel: Shadows, Midtones, Highlights wheels + blending
- Optics panel: Lens correction
- Geometry panel: Perspective and skew correction
- Effects panel: Grain and Vignetting
- Calibration panel

**Liquify Filter**
- Standalone dialog with full canvas preview
- Tools within Liquify: Forward Warp, Reconstruct, Smooth, Twirl Clockwise, Pucker, Bloat, Push Left, Mirror, Turbulence, Freeze Mask, Thaw Mask, Face-Aware Liquify, Hand, Zoom
- Face-Aware Liquify: Detect faces and provide sliders for Eyes, Nose, Mouth, Face Shape adjustments per face
- Mesh display options
- Save and Load mesh
- Brush Options: Size, Density, Pressure, Rate, Stylus Pressure
- Reconstruct Options: restore with different algorithms

**Vanishing Point Filter**
- Define perspective planes
- Clone, paint, and paste within perspective
- Multiple planes with angle connections

**Neural Filters** (AI-powered filters)
- These require either a backend ML service or WebAssembly ONNX models
- Examples: Skin Smoothing, Neural Sharpen, JPEG Artifact Removal, Photo Restoration, Colorize, Depth Blur, Makeup Transfer, Smart Portrait (emotional expression manipulation), Style Transfer, Landscape Mixer, Color Transfer
- These will be the most technically challenging and should be phase-3 implementation items

### 9.2 Image Adjustments

These appear under Image > Adjustments and can also be applied as Adjustment Layers:

- **Brightness/Contrast** — Simple two-slider interface, Legacy mode option
- **Levels** — Black point, midtone gamma, white point input sliders; output range sliders; per-channel control; Auto button; histogram display
- **Curves** — Interactive curve editor; click to add points; drag points; per-channel control; preset curves; input/output value display; pencil freehand draw mode
- **Exposure** — Exposure (EV), Offset, Gamma Correction; eyedropper for black/gray/white point
- **Vibrance** — Vibrance and Saturation sliders (Vibrance is a smart saturation that protects already-saturated and skin tones)
- **Hue/Saturation** — Master or per-color-range (Reds, Yellows, Greens, Cyans, Blues, Magentas); Hue, Saturation, Lightness sliders; Colorize mode; eyedropper for range selection; range drag handles
- **Color Balance** — Shadows/Midtones/Highlights tone balance; Cyan-Red, Magenta-Green, Yellow-Blue sliders; Preserve Luminosity
- **Black & White** — Per-color-range luminosity control; Tint option; Auto; preset list; on-canvas color range drag
- **Photo Filter** — Filter color picker or preset list; Density slider; Preserve Luminosity
- **Channel Mixer** — Source channel percentages per output channel; Monochrome mode; Constant; presets
- **Color Lookup** — 3DLUT file selection (Abstract, Device Link, Abstract categories)
- **Invert** — Inverts all pixel values, no parameters
- **Posterize** — Levels input (number of tonal steps)
- **Threshold** — Slider converts to pure black/white at threshold level; histogram display
- **Gradient Map** — Maps grayscale luminosity to gradient colors; gradient picker; Dither; Reverse
- **Selective Color** — Per-color-range CMYK correction; Reds, Yellows, Greens, Cyans, Blues, Magentas, Whites, Neutrals, Blacks; Method: Relative or Absolute
- **Shadows/Highlights** — Amount, Tone, Radius for both; Color and Midtone Contrast; Black/White Clip (requires Show More Options dialog)
- **HDR Toning** — For 32-bit images; Edge Glow, Tone and Detail, Advanced, Toning Curve
- **Desaturate** — Removes all color, no parameters
- **Match Color** — Match luminosity and color of another open document
- **Replace Color** — Build selection by color range, then adjust Hue/Saturation/Lightness
- **Equalize** — Redistributes pixel values to span full brightness range
- **Auto Tone, Auto Contrast, Auto Color** — Automatic one-click adjustments with configurable algorithm options

---

## 10. Selection System

### 10.1 Selection Data Model

A selection is a grayscale mask (0-255 per pixel) representing partial transparency of selection. This allows feathered and anti-aliased selections to be modeled precisely. The selection must be stored at full document resolution.

### 10.2 Selection Operations

**Boolean Operations:**
- New Selection (replaces existing)
- Add to Selection (Shift)
- Subtract from Selection (Alt)
- Intersect with Selection (Shift+Alt)

**Transform Selection:**
- Move selection boundary without moving pixels
- Scale, rotate selection boundary
- Warp selection boundary

**Modify Selection:**
- Border — Creates a border of specified width around selection
- Smooth — Rounds sharp corners by a specified radius
- Expand — Grows selection by specified pixel amount
- Contract — Shrinks selection by specified pixel amount
- Feather — Softens selection edge by specified radius

**Select Menu Operations:**
- All (Ctrl+A)
- Deselect (Ctrl+D)
- Reselect (Ctrl+Shift+D) — Restores last selection
- Inverse (Ctrl+Shift+I)
- All Layers
- Deselect Layers
- Find Layers
- Isolate Layers
- Color Range — Select by sampled color across entire image
- Focus Area — Select in-focus areas using depth-of-field detection
- Subject — Content-aware subject selection
- Sky — Specifically detect and select sky regions
- Select and Mask (Refine Edge) — Full dialog for hair/fur edge refinement

### 10.3 Select and Mask Dialog

This is a standalone dialog for refining complex selections:

- View modes: Onion Skin, Marching Ants, Overlay, Black, White, Black & White, On Layers
- Global Refinements: Radius, Smart Radius, Smooth, Feather, Contrast, Shift Edge
- Refine Edge Brush Tool: Paint over hair/fur to detect fine strands
- Quick Selection and Brush tools within the dialog
- Output Settings: Output to Selection, Layer Mask, New Layer, New Layer with Layer Mask, New Document, New Document with Layer Mask
- Decontaminate Colors option

---

## 11. Transform System

### 11.1 Free Transform (Ctrl+T)

When Free Transform is active:
- Bounding box with handles appears around content
- Corner handles: scale proportionally with Shift
- Edge handles: scale in one axis
- Rotate: cursor outside corner handles
- Skew: Ctrl+drag edge handle
- Distort: Ctrl+drag corner handle
- Perspective: Ctrl+Alt+Shift+drag corner handle
- Options bar shows W, H, X, Y, rotation angle, skew inputs with lock aspect ratio toggle
- Interpolation method: Nearest Neighbor, Bilinear, Bicubic, Bicubic Smoother, Bicubic Sharper, Bicubic Automatic

### 11.2 Warp

Warp mode accessed from within Free Transform:
- Grid overlay with control handles
- Drag grid intersections, lines, or areas
- Preset warps: Arc, Arc Lower, Arc Upper, Arch, Bulge, Shell Lower, Shell Upper, Flag, Wave, Fish, Rise, Fisheye, Inflate, Squeeze, Twist
- Split Warp: Ctrl+drag line to add split
- Custom grid: change grid divisions

### 11.3 Other Transform Operations

- Rotate 180°
- Rotate 90° Clockwise / Counter Clockwise
- Flip Horizontal / Vertical
- Perspective Warp — Define planes and adjust perspective independently of content
- Puppet Warp — Place pins and drag to deform with mesh visualization
- Content-Aware Scale — Scale while protecting specified content (subject, skin tones, saved channel)

---

## 12. File Format Support

### 12.1 Native Format

**PSD (Photoshop Document)**
- The primary project format
- Must preserve all layer types, adjustment layers, effects, masks, paths, channels, metadata
- Binary format with a defined specification
- Implement a JavaScript/WASM PSD parser and writer
- Lossless data preservation is mandatory

### 12.2 Import Formats

- **JPEG** — Standard import via browser's native canvas drawImage
- **PNG** — With transparency support
- **GIF** — Including animated GIF frame extraction
- **WebP** — Modern format support
- **BMP** — Basic bitmap import
- **TIFF** — Including layered TIFF where possible
- **SVG** — Import as Smart Object or rasterize
- **PDF** — Rasterize pages at chosen resolution
- **Camera Raw Formats (CR2, NEF, ARW, DNG, etc.)** — Requires a raw decode library (dcraw.js or similar WASM-compiled solution)
- **HEIC/HEIF** — Modern camera format, browser support dependent

### 12.3 Export Formats

- **JPEG** — Quality slider, baseline vs progressive, color subsampling
- **PNG** — PNG-8 and PNG-24, compression level, interlacing
- **GIF** — Color table settings, dither, transparency, interlacing, animation parameters
- **WebP** — Lossy and lossless, quality setting
- **TIFF** — Compression options
- **BMP** — Basic export
- **PSD** — Save full project
- **PDF** — Flatten or preserve layers
- **SVG** — For vector/shape content

### 12.4 Export for Web (Save for Web)

A dedicated dialog replicating Photoshop's Save for Web:
- 2-up or 4-up preview comparison
- Format selection with format-specific options
- File size estimate display
- Color table for GIF/PNG-8
- Image size resize
- Metadata options
- Browser preview button

---

## 13. Menu System

### 13.1 Photoshop Menu Bar

All menus must be implemented as faithful replicas:

**Photoshop/File Menu:**
- New (with full New Document dialog matching Photoshop's, including preset categories: Photo, Print, Art & Illustration, Web, Mobile, Film & Video; recent sizes; template search)
- Open, Open As, Open Recent (submenu with recent files)
- Close, Close All, Close and Go to Bridge
- Save, Save As, Save a Copy
- Revert
- Place Embedded, Place Linked
- Export (Export As, Save for Web, Artboards to Files/PDF/Images, Layer Comps to Files/PDF/Images, Layers to Files, Color Lookup Tables, Data Sets as Files, Video Render)
- Generate
- Share on Behance
- Automate (Batch, PDF Presentation, Create Droplet, Crop and Straighten Photos, Contact Sheet II, Fit Image, Photomerge)
- Scripts (Image Processor, Load Files into Stack, Statistics, etc.)
- File Info (metadata XMP editor)
- Print Settings, Print
- Exit/Quit

**Edit Menu:**
- Undo, Redo
- Toggle Last State
- Cut, Copy, Copy Merged, Paste, Paste In Place, Paste Into, Paste Outside, Clear
- Search
- Check Spelling
- Find and Replace Text
- Fill (with dialog: Contents, Blending, preserve transparency)
- Stroke (with dialog)
- Content-Aware Fill (opens dedicated dialog with sampling area, fill settings, output options)
- Content-Aware Scale
- Puppet Warp
- Perspective Warp
- Free Transform
- Transform (submenu: Again, Scale, Rotate, Skew, Distort, Perspective, Warp, Split Warp options, all flip/rotate presets)
- Auto-Align Layers
- Auto-Blend Layers
- Sky Replacement (full dialog)
- Define Brush Preset
- Define Pattern
- Define Custom Shape
- Purge (Undo, Clipboard, History, All, Video Cache)
- Adobe PDF Presets
- Presets (Manage Presets, Migration options, Import, Export, Get More Presets)
- Remote Connections
- Color Settings
- Assign Profile
- Convert to Profile
- Keyboard Shortcuts
- Menus
- Toolbar
- Preferences (full Preferences dialog with all sub-panels)

**Image Menu:**
- Mode submenu (all color modes, bit depths, Grayscale discard color, CMYK conversion, etc.)
- Adjustments submenu (all adjustment types listed in section 9.2)
- Auto Tone, Auto Contrast, Auto Color
- Image Size dialog (width/height in various units, resolution, resample method)
- Canvas Size dialog (width/height, anchor position 3x3 grid, canvas extension color)
- Image Rotation submenu (180°, 90° CW/CCW, Arbitrary, Flip Canvas H/V)
- Crop (to selection)
- Trim (transparent pixels or color)
- Reveal All (expand canvas to show all layer content)
- Duplicate
- Apply Image (blend a channel or layer from current or other document onto current)
- Calculations (blend two channels to create new channel/selection)
- Variables (define variables for data-driven graphics)
- Apply Data Set
- Trap

**Layer Menu:**
- New (Layer, Group, Group from Layers, Layer from Background, Background from Layer, Layer via Copy, Layer via Cut)
- Copy CSS, Copy SVG
- Layer Style submenu
- Smart Filter submenu
- New Fill Layer submenu
- New Adjustment Layer submenu
- Layer Content Options
- Layer Mask submenu
- Vector Mask submenu
- Create/Release Clipping Mask
- Smart Objects submenu
- Video Layers submenu
- Rasterize submenu
- New Layer Based Slice
- Group Layers, Ungroup Layers
- Hide/Show Layers
- Arrange submenu (Bring to Front, Bring Forward, Send Backward, Send to Back, Reverse)
- Combine Shapes submenu
- Align submenu (Top Edges, Vertical Centers, Bottom Edges, Left Edges, Horizontal Centers, Right Edges)
- Distribute submenu
- Lock All Layers in Group
- Link Layers, Select Linked Layers
- Merge Layers, Merge Visible, Flatten Image
- Matting submenu (Defringe, Remove Black/White Matte)

**Type Menu:**
- Panels (Character, Paragraph, Glyphs, Character Styles, Paragraph Styles)
- Anti-Aliasing submenu
- Orientation submenu
- OpenType submenu (features toggles)
- Extrude to 3D
- Warp Text
- Match Font
- Font Preview Size submenu
- Language Options
- Update All Text Layers
- Replace All Missing Fonts
- Resolve Missing Fonts
- Paste Lorem Ipsum
- Load Default Type Styles
- Save Default Type Styles

**Select Menu:**
- All, Deselect, Reselect, Inverse
- All Layers, Deselect Layers, Find Layers, Isolate Layers
- Color Range
- Focus Area
- Subject
- Sky
- Select and Mask
- Modify submenu
- Grow, Similar
- Transform Selection
- Edit in Quick Mask Mode
- Load Selection
- Save Selection
- New 3D Extrusion from Current Selection

**Filter Menu:**
- Last Filter (repeat last filter with same settings)
- Convert for Smart Filters
- Neural Filters
- Filter Gallery
- Adaptive Wide Angle
- Camera Raw Filter
- Lens Correction
- Liquify
- Vanishing Point
- All filter category submenus as described in section 9.1

**3D Menu** (lower priority — can be deferred)

**View Menu:**
- Proof Setup, Proof Colors, Gamut Warning
- Zoom In/Out, Fit on Screen, Fit Artboard on Screen, 100%, 200%
- Screen Mode submenu
- Extras, Show submenu (Guides, Grid, Rulers, Slices, Selection Edges, Target Path, Annotations, Artboard Names, Count, Layer Edges, Smart Guides, Pixel Grid)
- Rulers
- Snap, Snap To submenu
- Lock Guides, Clear Guides
- New Guide, New Guide Layout, New Guides from Shape
- Lock Slices, Clear Slices

**Window Menu:**
- Arrange submenu (Cascade, Tile, Float All in Windows, Consolidate All to Tabs, Match Zoom, Match Location, Match Rotation)
- Workspace submenu
- Find Extensions on Exchange
- Extensions submenu
- 3D
- Actions, Adjustments, Brush Settings, Brushes, Channels, Character, Character Styles, Clone Source, Color, Glyphs, Gradients, Histogram, History, Info, Layer Comps, Layers, Libraries, Measurement Log, Navigator, Notes, Paragraph, Paragraph Styles, Paths, Patterns, Properties, Shapes, Styles, Swatches, Timeline, Tool Presets, Toolbox, Options

**Help Menu:**
- Photoshop Help
- Photoshop Online Resources
- About Photoshop
- About Plug-ins
- Legal Notices
- GPU Compatibility
- System Info
- Manage Extensions
- Updates

---

## 14. Keyboard Shortcut System

### 14.1 Shortcut Architecture

The keyboard shortcut system must be a fully configurable mapping layer that intercepts keyboard events at the application level and dispatches corresponding commands. No shortcut should be hardcoded into individual components.

### 14.2 Default Shortcut Set

Implement all of Photoshop's default keyboard shortcuts:

**Tools (all single-letter activations):**
- V — Move Tool
- M — Marquee Tools (cycle M)
- L — Lasso Tools (cycle L)
- W — Quick Selection/Magic Wand
- C — Crop Tool
- I — Eyedropper
- J — Healing Tools
- B — Brush/Pencil/Mixer Brush
- S — Clone Stamp/Pattern Stamp
- E — Eraser Tools
- G — Gradient/Paint Bucket
- O — Dodge/Burn/Sponge
- P — Pen Tools
- T — Type Tools
- A — Path/Direct Selection
- U — Shape Tools
- H — Hand Tool
- R — Rotate View
- Z — Zoom Tool
- D — Default Colors
- X — Swap Colors
- Q — Quick Mask Toggle

**All standard Ctrl/Cmd combinations exactly matching Photoshop defaults**

**Modifier behaviors:**
- Shift+letter cycles through tool group
- Holding Ctrl temporarily switches to Move Tool
- Holding Alt modifies active tool behavior (add/subtract, sample, etc.)
- Holding Space temporarily switches to Hand Tool

### 14.3 Customizable Shortcuts

The Keyboard Shortcuts dialog must allow:
- Complete remapping of any command or tool
- Separate shortcut sets for Application Menus, Panel Menus, and Tools
- Save named shortcut sets
- Import/Export shortcut sets
- Summarize and Print shortcuts (formatted as text/PDF)

---

## 15. History & Undo System

### 15.1 Linear History

- Default 50 history states (configurable up to 1000 in preferences)
- Each history state stores the document's full state or a delta
- History panel shows named states (e.g., "Gaussian Blur", "Brush Stroke", "Layer Opacity Change")
- Clicking a history state reverts document to that point
- Making an edit after jumping back creates a new branch (old forward states lost)
- History states are stored efficiently — pixel layer changes store only affected tile regions

### 15.2 Snapshots

- User can create named snapshots at any point
- Snapshots persist even when history states are pushed off the stack
- Snapshots can capture full document, merged layers, or current layer
- History Brush can paint from any snapshot as source

### 15.3 Non-Linear History

Non-linear history mode (in preferences) allows reverting to a history state and making edits without losing the forward states. This is for advanced users but must be supported.

### 15.4 History Storage Strategy

Storing full canvas state for every edit would be memory-prohibitive. The strategy must use:
- **Command pattern** — Each operation stores enough data to undo and redo itself
- **Dirty rectangle tracking** — Only the affected region of pixel data is stored
- **Layer deltas** — Store only which layers changed, not the entire document
- **Compression** — All stored pixel data is compressed before going into memory/IndexedDB
- **Disk spillover** — When in-memory history exceeds threshold, oldest states move to IndexedDB

---

## 16. Content-Aware Features

Content-aware features are the most technically demanding set of operations. They require sophisticated algorithms and can leverage pre-trained models in WebAssembly.

### 16.1 Content-Aware Fill

- User selects unwanted area
- Algorithm analyzes surrounding image content
- Fills selection with plausibly realistic content matching texture, perspective, and lighting
- Dedicated dialog shows sampling area (green overlay), fill settings, output options
- Algorithm: PatchMatch or similar exemplar-based inpainting, or WASM-compiled deep learning model

### 16.2 Content-Aware Scale

- Scale canvas without distorting focal subjects
- Protect subjects via skin tone detection or user-defined channel mask
- Seam carving algorithm implementation

### 16.3 Content-Aware Move

- Move selected object to new location
- Fill original location with content-aware fill
- Blend moved object into new background

### 16.4 Subject Selection & Sky Selection

- These require semantic segmentation models
- Can be implemented with a lightweight ONNX model compiled to WebAssembly
- Or deferred to a backend API call
- Sky selection specifically detects sky-region using color gradients and scene understanding

### 16.5 Sky Replacement

- Detect sky region
- Replace with chosen sky from preset library or user-imported sky image
- Blend sky with foreground including lighting adjustment, edge refinement, and color grading of foreground to match sky

---

## 17. Text & Typography System

### 17.1 Font Rendering

- Use the browser's native text rendering via Canvas 2D text APIs for basic rendering
- For advanced typography (kerning pairs, ligatures, OpenType features), integrate a JavaScript font renderer (opentype.js or similar)
- Web Font loading for system fonts and uploaded custom fonts
- Font preview in the font family dropdown

### 17.2 Text Engine Requirements

- Full Unicode support
- Right-to-left text support (Arabic, Hebrew)
- Vertical text for CJK
- Bidirectional text
- OpenType feature toggling (must parse font files for available features)
- Glyph panel showing all glyphs in a font with alternate glyph selection

### 17.3 Text Reflow

- Area text must reflow when bounding box is resized
- Overset text indicator when text doesn't fit
- Baseline grid alignment

---

## 18. Performance Strategy

### 18.1 Tile-Based Rendering

Large canvases must be divided into tiles (e.g., 256×256 or 512×512 pixels). Only tiles that intersect the current viewport need to be composited and drawn. This allows very large documents (10,000 × 10,000+ pixels) to remain performant.

### 18.2 Progressive Compositing

When a filter or operation is applied to a large canvas:
1. Show an immediate low-quality preview
2. Process in background Web Worker
3. Update canvas regions progressively as tiles complete
4. User can continue interacting with unprocessed regions

### 18.3 GPU Offloading

- All blend mode compositing should target WebGL2 fragment shaders
- Filter effects with convolution operations should run as GLSL shader programs
- Canvas-to-texture and texture-to-canvas transfers must be minimized

### 18.4 Memory Management

- Inactive layer canvases should be serialized and freed from GPU memory
- LRU cache for layer thumbnail generation
- Explicit garbage collection triggers after heavy operations
- Memory usage monitor in preferences/info

### 18.5 Brush Performance

- Brush strokes must maintain responsiveness at minimum 60fps for small brushes
- For large brushes, use progressive rendering with intermediate states
- Brush dabs are computed on a separate thread and transferred as ImageBitmap

---

## 19. State Management Architecture

### 19.1 Application State Domains

The state must be divided into clearly bounded domains:

**Document State** — All data describing the current document's content (layers, pixels, paths, guides, etc.)

**UI State** — Which panels are open, their positions and sizes, active workspace

**Tool State** — Active tool, each tool's options settings (persisted across sessions)

**Viewport State** — Zoom level, pan offset, rotation angle per document

**Selection State** — Current selection mask data

**History State** — History stack, current history position, snapshots

**Preference State** — All application preferences from the Preferences dialog

### 19.2 Immutability for History

Document state mutations must follow an immutable update pattern for any state that needs to be recorded in history. This allows easy implementation of undo/redo by swapping document state references rather than deep copying everything.

### 19.3 Reactivity

UI panels must reactively respond to document state changes. When the active layer changes, all panels that display layer properties must automatically update without explicit imperative notification calls.

---

## 20. Preferences System

### 20.1 Preferences Dialog Panels

Replicate all preference categories:

- **General** — Color picker, HUD Color Picker, Image Interpolation, Options checkboxes, History Log, Reset All Warning Dialogs
- **Interface** — Color Theme, Standard Screen Mode, Full Screen, Highlight Color, Border, Show channels in color, Show menu colors, Enable Flick Panning, UI Scaling options, UI Font Size, Text options
- **Workspace** — Auto-Collapse Iconic Panels, Auto-Show Hidden Panels, Open Documents as Tabs, Enable Narrow Options Bar
- **Tools** — Show Tool Tips, Rich Tool Tips, Show Transformation Values, Enable Gestures, Vary Round Brush Hardness, Vector Tools Behavior, Double-Click Layer Mask, Zoom with Scroll Wheel, Zoom Clicked Point to Center, Auto-Select Layer
- **History Log** — Save Log Items To (Metadata/Text File/Both), Edit Log Items detail level
- **File Handling** — Image Previews, File Extension, Save to Original Folder, Background Save, Auto Save Recovery, Recent File List size, Legacy File Save options, Camera Raw preferences, HEIC support
- **Export** — Quick Export Format settings, After Export behavior, Use Legacy Export
- **Performance** — Memory Usage slider, History States, Cache Levels, Cache Tile Size, GPU Settings (Use Graphics Processor, Enable OpenCL, Anti-alias guides and paths, 30 bit display), Scratch Disks
- **Scratch Disks** — Ordered list of scratch disk volumes
- **Cursors** — Painting Cursors style, Other Cursors style, Brush Preview color, Show Only Crosshair in Brush Tip
- **Transparency & Gamut** — Grid Size, Grid Colors, Gamut Warning color and opacity
- **Units & Rulers** — Ruler Units, Type Units, Column Size, New Document Preset Resolutions, Point/Pica Size
- **Guides, Grid & Slices** — Guide color/style, Smart Guide color, Grid color/style, Gridline every, Subdivisions, Slice Line Color, Show Slice Numbers
- **Plug-ins** — Generator, Remote Connections, Plug-in settings
- **Type** — Use Smart Quotes, Enable Missing Glyph Protection, Show Font Names in English, Font Preview size, Number of Recent Fonts
- **3D** — Various 3D performance and display settings

---

## 21. Automation & Scripting System

### 21.1 Actions

Actions record user operations as named sequences that can be replayed:
- Record mode captures all user actions
- Insertable pauses (Stop with message) allow user input during playback
- Menu Item insertion for operations not recordable otherwise
- Conditional actions with branching (If/Then/Else based on document state)
- Batch processing: run action on folder of images
- Droplet creation: standalone processor application

### 21.2 Scripts

- JavaScript-based scripting API that exposes the document object model
- Script Events Manager: trigger scripts on application events
- Built-in scripts accessible from File > Scripts

---

## 22. Smart Objects System

### 22.1 Smart Object Capabilities

- Non-destructive embedding of raster or vector content
- All transforms applied to Smart Object are remembered and non-destructive
- Edit contents in a separate canvas (opens in new tab, save to update parent)
- Smart Filters: any filter applied to a Smart Object is a Smart Filter
  - Each Smart Filter has its own blending options
  - Each Smart Filter has its own mask
  - Smart Filters can be reordered, enabled/disabled, double-clicked to re-edit
  - Smart Filter stack is visible below the layer in the Layers panel

### 22.2 Linked Smart Objects

- Reference external files instead of embedding
- Update Linked brings in latest version of external file
- Package command collects all linked files

---

## 23. Phased Implementation Rollout

### Phase 1 — Foundation (Months 1-4)

**Goal:** A functional image editor with core capabilities

- Application shell, menu bar (with stub menus), toolbar structure
- Canvas rendering engine with proper zoom and pan
- Single document support
- Basic layer system: pixel layers, groups, visibility, opacity, basic blend modes (Normal, Multiply, Screen)
- Core tools: Move, Marquee (Rect/Ellipse), Lasso, Crop, Brush (basic), Eraser, Eyedropper, Paint Bucket, Zoom, Hand, Type (basic)
- Basic color system: RGB, 8-bit, foreground/background colors, color picker
- Undo/Redo (simple stack, no history panel yet)
- Open/Save: JPEG, PNG
- PSD import (basic, flattened or single-layer)
- Basic filter set: Gaussian Blur, Brightness/Contrast, Levels, Hue/Saturation

### Phase 2 — Core Feature Completeness (Months 5-9)

**Goal:** Professional-grade editing capability for photography workflows

- Complete layer system: adjustment layers, layer masks, clipping masks, blend modes (all 27)
- Layer effects (Drop Shadow, Inner Glow, Bevel & Emboss, Color/Gradient/Pattern Overlay, Stroke)
- History panel with full undo stack
- Channels panel
- Complete selection system with all select tools
- Select and Mask dialog
- Healing Brush, Clone Stamp, Patch Tool
- Dodge, Burn, Sponge, Blur, Sharpen, Smudge tools
- All Pen tools and path operations
- Complete Shape tools
- Smart Objects and Smart Filters
- Camera Raw Filter
- Complete filter menu (all blur, sharpen, noise, distort, stylize, pixelate, render filters)
- Filter Gallery
- Free Transform with all modes
- Puppet Warp
- Export for Web dialog
- PSD save/load (with layers)

### Phase 3 — Advanced Features (Months 10-14)

**Goal:** Advanced professional workflows

- Liquify filter with Face-Aware
- Vanishing Point filter
- Content-Aware Fill, Move, Scale
- Neural Filters (basic set using WASM/ONNX models or API)
- Full Actions system with batch processing
- Complete Brush engine with all dynamics
- Gradient editor and complete gradient tools
- Complete type engine with OpenType features, Glyph panel
- Paragraph and Character styles
- Timeline panel and GIF animation
- Layer Comps
- Color management with ICC profiles
- Soft proofing
- Perspective Warp
- Sky Replacement
- Subject Selection / Object Selection
- Complete Preferences dialog
- All workspace presets
- Keyboard shortcut customization

### Phase 4 — Polish & Advanced Workflows (Months 15-18)

**Goal:** Feature parity and professional polish

- 16-bit and 32-bit per channel support
- CMYK and Lab color modes
- Video layer support (basic)
- Libraries panel
- Cloud sync
- Plugin/Extension architecture
- Performance optimization (WebGPU integration)
- Printing system
- All remaining filters
- Complete automation/scripting API
- Accessibility audit and fixes
- Mobile/tablet touch and stylus optimization

---

## 24. Testing Strategy

### 24.1 Unit Testing

- Color math functions (blend modes, color conversions) must have exhaustive unit tests
- Selection Boolean operations verified against known outputs
- Transform matrix operations verified
- PSD parser/writer round-trip tests (parse PSD, write PSD, compare binary output)
- Filter algorithm outputs compared against reference implementations

### 24.2 Visual Regression Testing

- Automated screenshot comparison for every filter
- Compositing tests: given fixed layer stack, output matches reference PNG
- Tool operation tests: simulate mouse events on canvas, verify resulting pixels
- Use a pixel-comparison tool with configurable tolerance for anti-aliasing differences

### 24.3 Performance Testing

- Benchmark suite measuring:
  - Frame rate during brush strokes at various sizes
  - Time to apply each filter at standard resolutions (1024×768, 4000×6000, 10000×10000)
  - Layer compositing speed at various layer counts
  - PSD file parse and save times
- Performance regression detection in CI pipeline

### 24.4 Cross-Browser Testing

- Chrome (latest and -2 versions)
- Firefox (latest and -2 versions)
- Safari (latest) — special attention to OffscreenCanvas and WebGL differences
- Edge (latest)
- Automated browser matrix testing in CI

### 24.5 User Testing

- Task-completion rate testing with Photoshop users attempting standard workflows
- Shortcut muscle-memory verification (are shortcuts triggering correctly?)
- Panel docking interaction testing

---

## 25. Accessibility Considerations

### 25.1 Keyboard Navigation

- Full keyboard navigation of all menus
- Tab order within dialogs must be logical
- All tool shortcuts must work reliably
- Focus indicators must be visible

### 25.2 Screen Reader Support

- All buttons and icons must have accessible labels
- Canvas operations must announce results to screen readers where feasible
- Dialog titles and descriptions must be properly associated

### 25.3 Color Accessibility

- The UI must not rely solely on color to convey information
- Sufficient contrast ratios for all text elements
- High-contrast UI theme option

### 25.4 Motor Accessibility

- Stylus and tablet input support (Wacom, Apple Pencil)
- Touch gesture support for zoom and pan
- Pressure sensitivity mapping for brush tools

---

## 26. Internationalization

### 26.1 Language Support

- UI text must be externalized into translation files from the start
- Initially launch in English
- Priority secondary languages: Spanish, French, German, Japanese, Chinese (Simplified), Korean, Portuguese, Italian

### 26.2 Locale-Aware Formatting

- Number formatting (decimal separator, thousands separator)
- Units display based on locale settings
- Date formatting in file metadata

---

## 27. Security Considerations

### 27.1 File Loading Security

- All loaded image files must be sanitized before processing
- PSD file parser must guard against malformed files (buffer overflows, invalid offsets)
- SVG files loaded as embedded smart objects must have scripts stripped

### 27.2 Content Security Policy

- Strict CSP preventing code injection
- No eval() usage anywhere in the application
- Web Worker communication validated with message schemas

### 27.3 Cloud Storage Security

- All user project data encrypted at rest
- Encrypted in transit (HTTPS)
- User authentication with OAuth 2.0
- No user image data used for training models without explicit consent

---

## 28. Offline Capability

### 28.1 Service Worker Implementation

- Full application shell cached for offline use
- All core libraries cached
- IndexedDB for storing open projects locally
- Offline indicator in UI
- Sync queue for cloud operations when reconnecting

---

## 29. Plugin / Extension Architecture

### 29.1 Plugin API Design

Define a stable public API that third-party plugins can use:
- Document manipulation (read/write layer data, pixel data, selection)
- Panel registration (add custom panels to the workspace)
- Filter registration (appear in Filter menu)
- Tool registration (appear in toolbar)
- Menu item registration
- Event subscription (react to document events)

Plugins run in isolated sandboxed iframes or Workers to prevent security issues and crashes affecting the main application.

---

## 30. Success Metrics & Acceptance Criteria

### 30.1 Feature Parity Metrics

- 100% of Photoshop tools implemented and functional
- 100% of Photoshop menu items implemented (or explicitly deferred with roadmap note)
- All 27 blend modes mathematically correct (within float precision tolerance)
- All adjustment layers producing output matching Photoshop within 2% average pixel difference
- PSD files saved by the clone can be opened in real Photoshop without data loss

### 30.2 Performance Metrics

- Brush strokes at 100px size: sustained 60fps on a mid-range laptop
- Gaussian Blur (50px radius) on a 4000×3000 image: completes in under 3 seconds
- Application load time (cold): under 5 seconds on broadband
- Document open time for a 50MB PSD: under 8 seconds

### 30.3 Stability Metrics

- Zero data-loss bugs (unsaved changes must never be silently lost)
- Auto-recovery on browser crash via IndexedDB persistence
- Memory usage must not grow unboundedly during a session

---

## Appendix A — Reference Material

- Adobe Photoshop User Guide (current version documentation)
- PSD/PSB File Format Specification (publicly available Adobe document)
- W3C Canvas 2D API Specification
- WebGL 2.0 Specification
- WebGPU Specification (draft)
- WASM SIMD Proposal documentation
- ICC Color Management Architecture specification
- OpenType Font Specification
- CSS Compositing and Blending Level 1 (for reference blend mode formulas)

---

## Appendix B — Critical Algorithm References

- **Gaussian Blur:** Recursive IIR approximation or separated kernel convolution
- **Blend Modes:** W3C Compositing and Blending specification formulas
- **Bicubic Interpolation:** Keys bicubic kernel for high-quality resampling
- **Content-Aware Fill:** PatchMatch algorithm (Barnes et al., 2009)
- **Content-Aware Scale:** Seam carving algorithm (Avidan & Shamir, 2007)
- **Selection Anti-aliasing:** Wu's line algorithm applied to selection boundaries
- **Liquify Warp:** Free-form deformation using moving least squares
- **Magnetic Lasso:** Dynamic programming shortest path on edge-detected gradient image
- **Face Detection for Face-Aware Liquify:** Viola-Jones or deep learning landmark detection

---

*This document serves as the authoritative specification for the web-based Photoshop clone project. Every section represents a concrete implementation requirement. Teams should treat this as a living document, updating implementation status notes and linking to relevant code modules as development progresses.*