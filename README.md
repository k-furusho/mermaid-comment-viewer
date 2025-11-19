# Mermaid Comment Viewer

A VS Code extension that helps you visualize Mermaid diagrams directly from your code comments.

![Mermaid Preview](media/demo.gif)

## ✨ Features

- **💬 Code Comment Support**: Write Mermaid diagrams in block comments or docstrings.
- **🔍 Interactive Preview Panel**: View diagrams in a dedicated side panel with **Zoom** and **Pan** support.
- **🖱️ Hover Preview**: Quickly glance at diagrams by hovering over the Mermaid code.
- **⚡ CodeLens Integration**: One-click "Show Preview" button above every Mermaid block.
- **🌍 Multi-Language**: Supports TypeScript, JavaScript, Python, Go, and Rust.

## 🚀 Usage

### 1. Write Mermaid Code in Comments

Add a `mermaid` keyword to your comment block:

**TypeScript / JavaScript / Go / Rust:**
```typescript
/* mermaid
graph TD
    A[Client] --> B[Load Balancer]
    B --> C[Server01]
    B --> D[Server02]
*/
```

**Python:**
```python
"""mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: I am good thanks!
"""
```

### 2. View the Diagram

You have three ways to view the diagram:

1.  **CodeLens**: Click the `Show Preview` text appearing above the comment block.
2.  **Hover**: Hover your mouse cursor over the `mermaid` keyword.
3.  **Command**: Run `Mermaid: Show Preview` from the Command Palette.

### 3. Interact with the Preview

The preview panel supports:
- **Zoom In/Out**: Use the toolbar buttons `+` / `-` or `Ctrl` + `Mouse Wheel`.
- **Pan**: Drag the diagram with your mouse to move it around.
- **Reset**: Click the `↺` button to reset the view.

## 📦 Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P`
3. Type `ext install k-furusho.mermaid-comment-viewer`

## 🛠️ Supported Languages

| Language | Syntax |
|----------|--------|
| **TypeScript / JS** | `/* mermaid ... */` |
| **Go** | `/* mermaid ... */` |
| **Rust** | `/* mermaid ... */` or `//! mermaid` |
| **Python** | `"""mermaid ... """` or `'''mermaid ... '''` |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT
