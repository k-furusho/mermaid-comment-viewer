import * as vscode from 'vscode';

export class WebviewService {
  private static instance: WebviewService;
  private currentPanel: vscode.WebviewPanel | undefined;
  private extensionUri: vscode.Uri | undefined;
  private lastMermaidCode: string | undefined;

  private constructor() {}

  public static getInstance(): WebviewService {
    if (!WebviewService.instance) {
      WebviewService.instance = new WebviewService();
    }
    return WebviewService.instance;
  }

  public initialize(context: vscode.ExtensionContext): void {
    this.extensionUri = context.extensionUri;
  }

  public hasActivePanel(): boolean {
    return this.currentPanel?.visible ?? false;
  }

  public refresh(): void {
    if (this.currentPanel && this.lastMermaidCode) {
      this.currentPanel.webview.html = this.getHtmlContent(
        this.currentPanel.webview,
        this.lastMermaidCode
      );
    }
  }

  public showPreview(mermaidCode: string): void {
    if (!this.extensionUri) {
      return;
    }

    // save the latest code
    this.lastMermaidCode = mermaidCode;

    const activeEditor = vscode.window.activeTextEditor;

    // determine the column to display the editor
    let targetColumn = vscode.ViewColumn.Two;
    if (activeEditor) {
      // if the current editor is in column 1, display in column 2, if in column 2, display in column 3
      targetColumn = (activeEditor.viewColumn || vscode.ViewColumn.One) + 1;
    }

    // if the panel already exists, reuse it
    if (this.currentPanel) {
      // display the existing panel in the appropriate position
      this.currentPanel.reveal(targetColumn, false); // preserveFocus = false
      this.currentPanel.webview.html = this.getHtmlContent(this.currentPanel.webview, mermaidCode);

      // update the title to show the latest preview
      this.currentPanel.title = 'Mermaid Preview';
      return;
    }

    // create a new panel
    this.currentPanel = vscode.window.createWebviewPanel(
      'mermaidPreview',
      'Mermaid Preview',
      {
        viewColumn: targetColumn,
        preserveFocus: true, // keep the focus on the editor
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
      }
    );

    this.currentPanel.webview.html = this.getHtmlContent(this.currentPanel.webview, mermaidCode);

    // If the panel is disposed, clear the reference
    this.currentPanel.onDidDispose(() => {
      this.currentPanel = undefined;
    });


  }

  private getHtmlContent(webview: vscode.Webview, mermaidCode: string): string {
    if (!this.extensionUri) {
      return '';
    }

    const mermaidUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'mermaid.min.js')
    );

    // escape the Mermaid code
    const escapedCode = mermaidCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // detect the VSCode theme and determine the Mermaid theme
    const config = vscode.workspace.getConfiguration('mermaidInlineViewer');
    const theme = config.get<string>('theme', 'base');
    const fontSize = config.get<number>('fontSize', 16);
    const backgroundColor = config.get<string>('backgroundColor', 'transparent');

    // use the dark theme and apply custom colors
    const themeConfig = {
      theme: theme,
      themeVariables: {
        fontSize: `${fontSize}px`,
        primaryColor: '#e8f4fd',
        primaryTextColor: '#1a1a1a',
        primaryBorderColor: '#2196f3',
        lineColor: '#2196f3',
        textColor: '#1a1a1a',
        secondaryColor: '#fff3e0',
        secondaryTextColor: '#1a1a1a',
        secondaryBorderColor: '#ff9800',
        tertiaryColor: '#f3e5f5',
        tertiaryTextColor: '#1a1a1a',
        tertiaryBorderColor: '#9c27b0',
        mainBkg: '#e3f2fd',
        secondBkg: '#fff3e0',
        tertiaryBkg: '#f3e5f5',
        edgeLabelBackground: '#ffffff',
        clusterBkg: '#f5f5f5',
        clusterBorder: '#757575',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        darkMode: false,
        background: '#ffffff'
      },
      securityLevel: 'loose'
    };
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Preview</title>
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
      background: rgba(255, 255, 255, 0.1);
      color: var(--vscode-button-foreground);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
    }
    .toolbar-button:hover {
      background: var(--vscode-button-hoverBackground);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .toolbar-button:active {
      transform: translateY(0);
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
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: ${backgroundColor === 'transparent' ? 'transparent' : backgroundColor};
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
    <button id="btn-copy-src" class="toolbar-button" title="Copy Source">📋 Source</button>
    <button id="btn-copy-md" class="toolbar-button" title="Copy Markdown">📝 Markdown</button>
    <div style="width: 1px; height: 16px; background: var(--vscode-widget-border); margin: 0 8px;"></div>
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

  <script src="${mermaidUri}"></script>
  <script>
    const mermaidCode = ${JSON.stringify(mermaidCode)};
    const themeConfig = ${JSON.stringify(themeConfig)};

    // initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      ...themeConfig
    });

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
    const errorContainer = document.getElementById('error-container');

    // Helper to safely display errors
    function displayError(title, message, code) {
      if (!errorContainer) return;

      errorContainer.innerHTML = '';

      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';

      const titleElem = document.createElement('h3');
      titleElem.textContent = title;

      const msgElem = document.createElement('p');
      msgElem.textContent = message;

      const codeBlock = document.createElement('div');
      codeBlock.className = 'code-block';

      const pre = document.createElement('pre');
      pre.textContent = code;

      codeBlock.appendChild(pre);
      errorDiv.appendChild(titleElem);
      errorDiv.appendChild(msgElem);
      errorDiv.appendChild(codeBlock);

      errorContainer.appendChild(errorDiv);

      if (mermaidWrapper) {
        mermaidWrapper.style.display = 'none';
      }
    }

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

    if (container) {
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
    }

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      e.preventDefault();
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
      if (container) {
        container.style.cursor = 'default';
      }
    });

    // button event listeners
    const btnZoomIn = document.getElementById('btn-zoom-in');
    if (btnZoomIn) btnZoomIn.addEventListener('click', () => zoom(0.2));

    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => zoom(-0.2));

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) btnReset.addEventListener('click', reset);

    // Copy Source
    document.getElementById('btn-copy-src')?.addEventListener('click', () => {
      navigator.clipboard.writeText(mermaidCode).then(() => {
        const btn = document.getElementById('btn-copy-src');
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = originalText, 2000);
      });
    });

    // Copy Markdown
    document.getElementById('btn-copy-md')?.addEventListener('click', () => {
      const initDirective = "%%{init: " + JSON.stringify(themeConfig) + " }%%";
      const fence = String.fromCharCode(96, 96, 96); // backticks
      const md = fence + "mermaid" + String.fromCharCode(10) + initDirective + String.fromCharCode(10) + mermaidCode + String.fromCharCode(10) + fence;
      navigator.clipboard.writeText(md).then(() => {
        const btn = document.getElementById('btn-copy-md');
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = originalText, 2000);
      });
    });

    window.addEventListener('error', (event) => {
      const code = mermaidDiv ? mermaidDiv.textContent : '';
      displayError('⚠️ Rendering Error', event.error?.message || 'Unknown error occurred', code);
    });

    // Render Mermaid
    (async () => {
      try {
        if (!mermaidDiv) return;
        const code = mermaidDiv.textContent;
        await mermaid.parse(code);
        await mermaid.run();
      } catch (error) {
        const code = mermaidDiv ? mermaidDiv.textContent : '';
        displayError('⚠️ Syntax Error', error.message || 'Unknown error occurred', code);
      }
    })();
  </script>
</body>
</html>`;
  }
}
