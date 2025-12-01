# Change Log

All notable changes to the "mermaid-comment-viewer" extension will be documented in this file.

## [1.0.1] - 2025-12-01

### Features
- Enhanced `Mermaid:` keyword support across all languages (TypeScript, Python, Go, Rust)
- Improved comment parsing logic to exclude documentation headers (e.g., "Usage:", "Security Considerations:")
- Added safety checks for text length and regex handling to prevent crashes

### Technical
- Refactored parsing logic with `BaseCommentParser` for consistent behavior
- Decoupled HTML rendering logic into `WebviewRenderer`
- Improved test stability by adjusting Vitest configuration
- Removed Confluence copy button (temporarily)

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
