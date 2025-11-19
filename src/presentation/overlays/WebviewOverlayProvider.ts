import * as vscode from 'vscode';
import type { ICommentParser } from '../../domain/interfaces/ICommentParser';
import { TypeScriptCommentParser } from '../../infrastructure/parsers/TypeScriptCommentParser';
import { PythonCommentParser } from '../../infrastructure/parsers/PythonCommentParser';
import { GoCommentParser } from '../../infrastructure/parsers/GoCommentParser';
import { RustCommentParser } from '../../infrastructure/parsers/RustCommentParser';
import type { Language } from '../../domain/types/BrandedTypes';

/**
 * Webview Overlayを使用したインラインMermaidプレビュー
 * Decoration APIの制限を回避し、真のオーバーレイ表示を実現
 */
export class WebviewOverlayProvider {
  private readonly parsers: Map<Language, ICommentParser>;
  private overlayPanel: vscode.WebviewPanel | undefined;
  private currentEditor: vscode.TextEditor | undefined;
  private updateTimeout: NodeJS.Timeout | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {
    console.log('[WebviewOverlayProvider] Constructor called');

    // initialize the parsers
    this.parsers = new Map();
    this.parsers.set('typescript', new TypeScriptCommentParser());
    this.parsers.set('javascript', new TypeScriptCommentParser());
    this.parsers.set('python', new PythonCommentParser());
    this.parsers.set('go', new GoCommentParser());
    this.parsers.set('rust', new RustCommentParser());

    // watch the editor change event
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // watch the active editor change event
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        this.currentEditor = editor;
        this.scheduleUpdate();
      }
    });

    // watch the text change event
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (this.currentEditor && event.document === this.currentEditor.document) {
        this.scheduleUpdate();
      }
    });

    // watch the scroll change event
    vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
      if (event.textEditor === this.currentEditor) {
        this.scheduleUpdate();
      }
    });
  }

  private scheduleUpdate(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(() => {
      this.updateOverlay();
    }, 300);
  }

  private async updateOverlay(): Promise<void> {
    const config = vscode.workspace.getConfiguration('mermaidInlineViewer');
    const previewMode = config.get('previewMode', 'marker');

    // if the preview mode is not overlay, do nothing
    if (previewMode !== 'overlay') {
      if (this.overlayPanel) {
        this.overlayPanel.dispose();
        this.overlayPanel = undefined;
      }
      return;
    }

    if (!this.currentEditor) {
      return;
    }

    const language = this.currentEditor.document.languageId as Language;
    const parser = this.parsers.get(language);

    if (!parser) {
      return;
    }

    const text = this.currentEditor.document.getText();
    const result = parser.parse(text);

    if (!result.ok || result.value.length === 0) {
      if (this.overlayPanel) {
        this.overlayPanel.dispose();
        this.overlayPanel = undefined;
      }
      return;
    }

    // create or update the Webview Overlay
    this.createOrUpdateOverlay(result.value);
  }

  private createOrUpdateOverlay(blocks: Array<{ code: any; range: any }>): void {
    if (!this.currentEditor) {
      return;
    }

    // create the Webview Panel (if it doesn't exist)
    if (!this.overlayPanel) {
      this.overlayPanel = vscode.window.createWebviewPanel(
        'mermaidOverlay',
        'Mermaid Overlay',
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.context.extensionUri, 'media')
          ]
        }
      );

      this.overlayPanel.onDidDispose(() => {
        this.overlayPanel = undefined;
      });
    }

    // generate the HTML content for the Webview Overlay
    const html = this.generateHtml(blocks, this.overlayPanel.webview);
    this.overlayPanel.webview.html = html;
  }

  private generateHtml(blocks: Array<{ code: any; range: any }>, webview: vscode.Webview): string {
    const mermaidUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'mermaid.min.js')
    );

    const diagrams = blocks.map((block, index) => {
      const code = (block.code as string).replace(/`/g, '\\`');
      return `
        <div class="mermaid-container" id="diagram-${index}">
          <div class="mermaid">
${code}
          </div>
        </div>
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="${mermaidUri}"></script>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: transparent;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            }
            .mermaid-container {
              margin: 20px 0;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            }
            .mermaid {
              display: flex;
              justify-content: center;
              align-items: center;
            }
          </style>
        </head>
        <body>
          ${diagrams}
          <script>
            mermaid.initialize({
              startOnLoad: true,
              theme: 'default',
              securityLevel: 'loose'
            });
          </script>
        </body>
      </html>
    `;
  }

  public dispose(): void {
    if (this.overlayPanel) {
      this.overlayPanel.dispose();
    }
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
  }
}

