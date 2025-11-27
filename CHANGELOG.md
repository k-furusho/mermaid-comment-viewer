# Change Log

All notable changes to the "mermaid-comment-viewer" extension will be documented in this file.

## [1.0.0] - 2025-11-26

### Features
- CodeLens provider for inline preview triggering
- Hover provider for quick diagram previews
- Interactive Webview panel for full diagram viewing
- Zoom and Pan capabilities (mouse wheel + drag)
- Copy Source button (raw Mermaid code)
- Copy Markdown button (with theme styling via init directive)
- Full-width responsive layout with glassmorphism UI
- Multi-language support: TypeScript, JavaScript, Python, Go, Rust
- Automatic theme adaptation (Light/Dark)

### Technical
- Switched to Mermaid UMD build for reliability
- Created ParserFactory to eliminate code duplication
- Removed all debug console.log statements
- Converted all comments to English
- Optimized package size
