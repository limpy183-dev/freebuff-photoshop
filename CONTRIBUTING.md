# Contributing to Freebuff Photoshop

Thank you for your interest in contributing to Freebuff Photoshop! This guide will help you get started with the project and ensure your contributions are consistent with our standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Code Style & Conventions](#code-style--conventions)
- [Testing](#testing)
- [Adding a New Tool](#adding-a-new-tool)
- [Adding a New Filter](#adding-a-new-filter)
- [Adding a New UI Panel](#adding-a-new-ui-panel)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Code of Conduct](#code-of-conduct)

---

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/freebuff-photoshop.git
   cd freebuff-photoshop
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (recommended: 20 LTS)
- npm (comes with Node.js)

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run tests in interactive watch mode |
| `npm run test:run` | Run tests once (for CI) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | Run TypeScript type checking without emitting files |

### Verifying Your Setup

Before making changes, ensure the project builds and tests pass on your machine:

```bash
npm run typecheck
npm run test:run
npm run build
```

---

## Project Architecture

Freebuff is organized into clear layers. Understanding these will help you place new code in the right location.

```
src/
├── core/           # Document model, layers, history, viewport, file I/O
├── filters/        # Image processing filters and adjustments
├── tools/          # Editing tools (brush, crop, lasso, etc.)
├── ui/             # UI components (toolbar, panels, canvas renderer, app shell)
├── utils/          # Shared utilities (color math, coordinate transforms)
├── types/          # Shared TypeScript type definitions
├── styles/         # Global CSS and theming
├── main.ts         # Application entry point
└── test/           # Test utilities and setup
```

### Key Principles

- **Separation of Concerns:** Image processing logic must be decoupled from UI rendering.
- **Performance First:** Heavy pixel operations should avoid blocking the main thread (Web Workers are preferred for complex filters).
- **Immutability:** History-tracked state mutations follow immutable update patterns.
- **No Framework in Hot Path:** The canvas rendering pipeline is vanilla TypeScript. UI panels use reactive updates, but canvas rendering avoids virtual DOM diffing.

---

## Code Style & Conventions

### TypeScript

- Use **strict TypeScript** everywhere. Avoid `any` types unless absolutely necessary.
- Prefer **interfaces** for public API shapes and **types** for unions/complex derivations.
- Use explicit return types on exported functions.
- Keep functions small and focused on a single responsibility.

### Naming

- `PascalCase` for classes, interfaces, types, and enums.
- `camelCase` for variables, functions, and methods.
- `UPPER_SNAKE_CASE` for constants.
- `kebab-case` for file names.

### File Organization

- Each major component/tool/panel gets its own file.
- Co-locate tests with source files using the `.test.ts` suffix (e.g., `brush-tool.ts` + `brush-tool.test.ts`).
- Re-use utilities from `src/utils/` rather than re-implementing logic.

### Comments & Documentation

- Document all exported functions, classes, and complex algorithms with JSDoc comments.
- Explain *why*, not just *what*, when the logic is non-obvious.

---

## Testing

All new code **must** include unit tests. We use [Vitest](https://vitest.dev/) with [jsdom](https://github.com/jsdom/jsdom) for DOM simulation.

### Writing Tests

- Place tests alongside the source file they test: `src/core/layer.ts` → `src/core/layer.test.ts`.
- Use descriptive test names that explain the behavior being verified.
- For pixel-level operations, assert on specific expected RGBA values.
- For UI components, assert on DOM state and event handling.

### Running Tests

```bash
# Interactive watch mode (use during development)
npm test

# Single run (use before pushing)
npm run test:run

# With coverage report
npm run test:coverage
```

### Coverage Expectations

- New features should not reduce overall coverage.
- Critical paths (color math, blend modes, coordinate transforms, file I/O) should be thoroughly covered.

---

## Adding a New Tool

All tools extend the base tool class and follow a consistent interface.

1. **Create the tool file** in `src/tools/` (e.g., `src/tools/my-tool.ts`).
2. **Implement the tool class** extending `ToolBase` from `src/tools/tool-base.ts`.
3. **Export it** from `src/tools/index.ts`.
4. **Add the tool to the toolbar** in `src/ui/toolbar.ts`.
5. **Write tests** in `src/tools/my-tool.test.ts`.

### Required Tool Behaviors

- `activate()` / `deactivate()` hooks
- `onPointerDown()`, `onPointerMove()`, `onPointerUp()` event handlers
- Options bar configuration (declare in the tool class)
- Cursor definition
- Keyboard shortcut letter assignment
- Tool group membership (for fly-out menus)
- Escape key cancellation handler

---

## Adding a New Filter

Filters are pure pixel manipulation functions.

1. **Create the filter function** in `src/filters/` (e.g., `src/filters/my-filter.ts`).
2. **Export it** from `src/filters/index.ts`.
3. **Write tests** verifying output pixels against known reference values.

### Filter Guidelines

- Filters must operate on `ImageData` and return new `ImageData` (immutable).
- Document the algorithm used and any performance considerations.
- For heavy filters, consider adding a Web Worker wrapper in the future.

---

## Adding a New UI Panel

1. **Create the panel component** in `src/ui/` (e.g., `src/ui/my-panel.ts`).
2. **Register it** in `src/ui/panels.ts`.
3. **Add a menu item** in `src/ui/menu-bar.ts` under the Window menu.
4. **Write tests** in `src/ui/my-panel.test.ts`.

### Panel Guidelines

- Panels must be dockable and remember their state (future requirement).
- Use CSS custom properties for all colors to support theming.
- Keep panel logic decoupled from domain/pixel logic.

---

## Pull Request Process

1. **Ensure all checks pass locally:**
   ```bash
   npm run typecheck
   npm run test:run
   npm run build
   ```

2. **Update documentation** if your change affects the README, architecture, or public APIs.

3. **Write a clear PR description** explaining:
   - What problem your PR solves or what feature it adds
   - How you implemented it
   - Any breaking changes
   - Screenshots (for UI changes)

4. **Keep PRs focused.** One feature or fix per PR is ideal.

5. **Link issues.** If your PR fixes an open issue, include `Fixes #123` in the description.

6. **Wait for CI.** Our GitHub Actions workflow will run typecheck, tests, and a production build on your PR.

7. **Address review feedback.** All PRs require at least one review before merging.

---

## Reporting Issues

When reporting a bug, please include:

- **Steps to reproduce** the issue
- **Expected behavior** vs. **actual behavior**
- **Browser and version** (e.g., Chrome 120, Firefox 121)
- **Screenshots** or screen recordings (if UI-related)
- **Console errors** (if any)
- **Operating system** (Windows, macOS, Linux)

For feature requests, describe:

- The feature you'd like to see
- Why it would be useful
- Any reference material (Photoshop screenshots, documentation links)

---

## Code of Conduct

- Be respectful and constructive in all interactions.
- Welcome newcomers and help them learn.
- Focus on what is best for the project and its users.
- Harassment, discrimination, or abusive behavior will not be tolerated.

---

## Questions?

If you have questions that aren't answered here, feel free to open a GitHub issue with the `question` label or reach out in existing discussions.

Thank you for helping make Freebuff Photoshop better!
