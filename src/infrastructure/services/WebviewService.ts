import * as vscode from 'vscode';

export class WebviewService {
  private static currentPanel: vscode.WebviewPanel | undefined;
  private static extensionUri: vscode.Uri | undefined;

  public static initialize(context: vscode.ExtensionContext): void {
    WebviewService.extensionUri = context.extensionUri;
  }

  public static hasActivePanel(): boolean {
    return WebviewService.currentPanel !== undefined && WebviewService.currentPanel.visible;
  }

  public static refresh(): void {
    if (WebviewService.currentPanel && WebviewService.lastMermaidCode) {
      console.log('[WebviewService] Refreshing preview');
      WebviewService.currentPanel.webview.html = WebviewService.getHtmlContent(
        WebviewService.currentPanel.webview,
        WebviewService.lastMermaidCode
      );
    }
  }

  public static showPreview(mermaidCode: string): void {
    console.log('[WebviewService] Showing preview for code:', mermaidCode.substring(0, 100));

    if (!WebviewService.extensionUri) {
      console.error('[WebviewService] Extension URI not set. Call initialize() first.');
      return;
    }

    // save the latest code
    WebviewService.lastMermaidCode = mermaidCode;

    const activeEditor = vscode.window.activeTextEditor;

    // determine the column to display the editor
    let targetColumn = vscode.ViewColumn.Two;
    if (activeEditor) {
      // if the current editor is in column 1, display in column 2, if in column 2, display in column 3
      targetColumn = (activeEditor.viewColumn || vscode.ViewColumn.One) + 1;
    }

    // if the panel already exists, reuse it
    if (WebviewService.currentPanel) {
      // display the existing panel in the appropriate position
      WebviewService.currentPanel.reveal(targetColumn, false); // preserveFocus = false
      WebviewService.currentPanel.webview.html = WebviewService.getHtmlContent(
        WebviewService.currentPanel.webview,
        mermaidCode
      );

      // update the title to show the latest preview
      WebviewService.currentPanel.title = 'Mermaid Preview';
      return;
    }

    // create a new panel
    WebviewService.currentPanel = vscode.window.createWebviewPanel(
      'mermaidPreview',
      'Mermaid Preview',
      {
        viewColumn: targetColumn,
        preserveFocus: true // keep the focus on the editor
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(WebviewService.extensionUri, 'media')
        ]
      }
    );

    WebviewService.currentPanel.webview.html = WebviewService.getHtmlContent(
      WebviewService.currentPanel.webview,
      mermaidCode
    );

    // if the panel is disposed, clear the reference
    WebviewService.currentPanel.onDidDispose(() => {
      WebviewService.currentPanel = undefined;
      console.log('[WebviewService] Panel disposed');
    });

    // if the panel is active, log the view state
    WebviewService.currentPanel.onDidChangeViewState((e) => {
      console.log('[WebviewService] Panel view state changed:', e.webviewPanel.visible);
    });
  }

  private static getHtmlContent(webview: vscode.Webview, mermaidCode: string): string {
    if (!WebviewService.extensionUri) {
      return '';
    }

    const mermaidUri = webview.asWebviewUri(
      vscode.Uri.joinPath(WebviewService.extensionUri, 'media', 'mermaid.esm.min.mjs')
    );

    // escape the Mermaid code
    const escapedCode = mermaidCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // detect the VSCode theme and determine the Mermaid theme
    // use the dark theme and apply custom colors
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Preview</title>
  <script type="module">
    import mermaid from '${mermaidUri}';

    // initialize Mermaid - use a light theme with custom colors
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        // background and basic colors
        primaryColor: '#e8f4fd',
        primaryTextColor: '#1a1a1a',
        primaryBorderColor: '#2196f3',

        // line and text colors
        lineColor: '#2196f3',
        textColor: '#1a1a1a',

        // secondary colors
        secondaryColor: '#fff3e0',
        secondaryTextColor: '#1a1a1a',
        secondaryBorderColor: '#ff9800',

        // other colors
        tertiaryColor: '#f3e5f5',
        tertiaryTextColor: '#1a1a1a',
        tertiaryBorderColor: '#9c27b0',

        // node background colors
        mainBkg: '#e3f2fd',
        secondBkg: '#fff3e0',
        tertiaryBkg: '#f3e5f5',

        // edge and arrow colors
        edgeLabelBackground: '#ffffff',
        clusterBkg: '#f5f5f5',
        clusterBorder: '#757575',

        // font
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '16px',

        // contrast
        darkMode: false,
        background: '#ffffff'
      },
      securityLevel: 'loose'
    });
  </script>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      padding: 8px 16px;
      background-color: var(--vscode-editorWidget-background);
      border-bottom: 1px solid var(--vscode-editorWidget-border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toolbar-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-foreground);
      flex: 1;
    }
    .toolbar-button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 4px 12px;
      border-radius: 2px;
      cursor: pointer;
      font-size: 12px;
    }
    .toolbar-button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .container {
      flex: 1;
      overflow: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .mermaid-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .mermaid {
      display: inline-block;
      background-color: #ffffff;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      min-width: 400px;
    }

    /* adjust the Mermaid SVG style */
    .mermaid svg {
      max-width: 100%;
      height: auto;
    }
    .error {
      max-width: 800px;
      margin: 20px auto;
      color: var(--vscode-errorForeground);
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      padding: 16px;
      border-radius: 4px;
    }
    .error h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
    }
    .error p {
      margin: 0 0 12px 0;
      font-size: 13px;
    }
    .code-block {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      border: 1px solid var(--vscode-editorWidget-border);
    }
    pre {
      margin: 0;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span class="toolbar-title">📊 Mermaid Diagram Preview</span>
    <button id="btn-zoom-in" class="toolbar-button" title="Zoom In (+)">➕</button>
    <button id="btn-zoom-out" class="toolbar-button" title="Zoom Out (-)">➖</button>
    <button id="btn-reset" class="toolbar-button" title="Reset View">↺</button>
  </div>
  <div class="container">
    <div class="mermaid-wrapper">
      <div class="mermaid">
${escapedCode}
      </div>
    </div>
    <div id="error-container"></div>
  </div>

    <script>
      // variables for zoom and pan
      let scale = 1;
      let isPanning = false;
      let startX = 0;
      let startY = 0;
      let translateX = 0;
      let translateY = 0;

      const mermaidWrapper = document.querySelector('.mermaid-wrapper');
      const mermaidDiv = document.querySelector('.mermaid');
      const container = document.querySelector('.container');

      // zoom function
      function zoom(delta) {
        const newScale = scale + delta;
        if (newScale > 0.1 && newScale < 5) {
          scale = newScale;
          updateTransform();
        }
      }

      // reset function
      function reset() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
      }

      // update the transform
      function updateTransform() {
        if (mermaidDiv) {
          mermaidDiv.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
        }
      }

      // zoom with the mouse wheel
      container.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          zoom(delta);
        }
      });

      // pan with the mouse
      container.addEventListener('mousedown', (e) => {
        isPanning = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        container.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
      });

      window.addEventListener('mouseup', () => {
        isPanning = false;
        container.style.cursor = 'default';
      });

      // button event listeners
      document.getElementById('btn-zoom-in').addEventListener('click', () => zoom(0.2));
      document.getElementById('btn-zoom-out').addEventListener('click', () => zoom(-0.2));
      document.getElementById('btn-reset').addEventListener('click', reset);

      window.addEventListener('error', (event) => {
        const errorContainer = document.getElementById('error-container');
        const mermaidWrapper = document.querySelector('.mermaid-wrapper');

        errorContainer.innerHTML = \`
          <div class="error">
            <h3>⚠️ Rendering Error</h3>
            <p>\${event.error?.message || 'Unknown error occurred'}</p>
            <div class="code-block">
              <pre>\${document.querySelector('.mermaid').textContent}</pre>
            </div>
          </div>
        \`;

        if (mermaidWrapper) {
          mermaidWrapper.style.display = 'none';
        }
      });

      // after the loading is complete, display smoothly
      window.addEventListener('load', () => {
        console.log('Mermaid diagram loaded successfully');
      });
    </script>
  </body>
  </html>`;
  }
}

