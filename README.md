# Freebuff Photoshop

A web-based Photoshop clone built entirely in the browser. Freebuff replicates Adobe Photoshop's core UI, tools, and image editing workflows using modern web technologies.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![Vitest](https://img.shields.io/badge/Vitest-1.1-6E9F18?logo=vitest)

## Features

- **Photoshop-like UI** — Dark-themed application frame, toolbar, panels, options bar, and status bar
- **Core Tools** — Brush, Eraser, Eyedropper, Marquee, Lasso, Clone Stamp, Gradient, Paint Bucket, Zoom, Hand, Crop, and more
- **Layer System** — Full layer stack with visibility, opacity, blend modes, and group support
- **Selection System** — Rectangle, ellipse, freehand (lasso), and magic wand selections
- **Filters & Adjustments** — Basic filters including blur, sharpen, brightness/contrast, hue/saturation, and levels
- **History & Undo** — Non-destructive editing with full undo/redo history
- **File I/O** — Open and save images (JPEG, PNG, TIFF, BMP, GIF, WebP)
- **Viewport** — Smooth zoom and pan from 0.1% to 12,800%
- **Color Management** — RGB color picker, foreground/background swatches, and swatch presets
- **Keyboard Shortcuts** — Photoshop-style single-letter tool shortcuts (V, B, E, Z, etc.)

## Tech Stack

- **Frontend:** Vanilla TypeScript, HTML5 Canvas 2D API
- **Build Tool:** Vite
- **Testing:** Vitest with jsdom
- **Styling:** CSS custom properties for theming
- **Type Checking:** TypeScript 5.3+

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (recommended)
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/limpy183-dev/freebuff-photoshop.git
cd freebuff-photoshop

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run tests in watch mode (Vitest) |
| `npm run test:run` | Run tests once (CI) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | Run TypeScript type checking without emitting files |

## Project Structure

```
src/
├── core/           # Document, layer, viewport, history, file I/O
├── filters/        # Image filters and adjustments
├── tools/          # All editing tools (brush, lasso, crop, etc.)
├── ui/             # UI components (app shell, panels, toolbar, canvas renderer)
├── utils/          # Utilities (color math, coordinates, math helpers)
├── types/          # Shared TypeScript types
├── styles/         # Global CSS and themes
├── main.ts         # Application entry point
└── test/           # Test setup and utilities
```

## Architecture

Freebuff uses a layered architecture designed for performance:

- **Presentation Layer** — DOM rendering, panel layouts, toolbar UI
- **Application Layer** — State management, command routing, tool orchestration
- **Domain Layer** — Pure image processing, compositing, color math, pixel manipulation
- **Infrastructure Layer** — File I/O, Web Workers, browser API abstractions
- **Persistence Layer** — Project saving, auto-save, history serialization

The rendering engine uses a multi-canvas approach (composite, working, layer, cache, and UI overlay canvases) to keep the main thread responsive.

## Roadmap

This project is being implemented in phases:

1. **Foundation** — Core shell, canvas engine, basic layer system, and essential tools
2. **Core Completeness** — Full layer effects, all selection tools, complete filter menu, transforms, and PSD save/load
3. **Advanced Features** — Liquify, Content-Aware Fill, Neural Filters, full typography engine, and Actions
4. **Polish** — 16/32-bit support, CMYK/Lab color modes, video layers, plugin architecture, and mobile optimization

See [`implementation_plan.md`](implementation_plan.md) for the full detailed specification.

## Contributing

Contributions are welcome! Please open an issue or pull request on GitHub.

## License

This project is proprietary. All rights reserved.

---

Built with passion by the Freebuff team.
