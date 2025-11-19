# Change Log

All notable changes to the "mermaid-comment-viewer" extension will be documented in this file.

## [1.0.0] - 2025-11-19

### Added

- **Interactive Preview Panel**: Added a dedicated webview panel to display Mermaid diagrams.
- **Zoom & Pan Support**: Implemented zoom (mouse wheel/buttons) and pan (drag) features in the preview panel.
- **CodeLens Integration**: Added a "Show Preview" CodeLens above Mermaid comment blocks.
- **Hover Preview**: Added basic hover preview support.
- **Multi-Language Support**: Added parsers for TypeScript, JavaScript, Python, Go, and Rust.

### Changed

- **Renamed**: Project renamed from `mermaid-inline-viewer` to `mermaid-comment-viewer`.
- **Architecture**: Removed unstable inline decoration preview in favor of a robust panel-based preview.

### Removed

- Removed inline decoration preview feature.
