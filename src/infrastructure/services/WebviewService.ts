import * as vscode from 'vscode';
import type { Language } from '../../domain/types/BrandedTypes';
import { LineNumber as LN } from '../../domain/types/BrandedTypes';
import { Result as R } from '../../domain/types/Result';
import { ParserFactory } from '../factories/ParserFactory';
import { WebviewRenderer } from '../renderers/WebviewRenderer';

export class WebviewService {
  private static instance: WebviewService;
  private currentPanel: vscode.WebviewPanel | undefined;
  private extensionUri: vscode.Uri | undefined;
  private lastMermaidCode: string | undefined;
  private currentDocument: vscode.TextDocument | undefined;
  private autoUpdateEnabled: boolean = false;
  private renderer: WebviewRenderer;

  private constructor() {
    this.renderer = new WebviewRenderer();
  }

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

  public showPreview(mermaidCode: string, document?: vscode.TextDocument): void {
    if (!this.extensionUri) {
      return;
    }

    // save the latest code and document
    this.lastMermaidCode = mermaidCode;
    this.currentDocument = document;
    this.autoUpdateEnabled = !!document;

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
      this.currentDocument = undefined;
      this.autoUpdateEnabled = false;
    });
  }

  public updateFromCursorPosition(document: vscode.TextDocument, position: vscode.Position): void {
    if (!this.autoUpdateEnabled || !this.currentPanel || !this.currentDocument) {
      return;
    }

    // Only update if the document matches
    if (document.uri.toString() !== this.currentDocument.uri.toString()) {
      return;
    }

    // Find Mermaid block at cursor position
    const mermaidCode = this.findMermaidAtPosition(document, position);
    if (mermaidCode) {
      this.lastMermaidCode = mermaidCode;
      this.currentPanel.webview.html = this.getHtmlContent(this.currentPanel.webview, mermaidCode);
    }
  }

  private findMermaidAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): string | undefined {
    const language = document.languageId as Language;
    const parser = ParserFactory.getParser(language);

    if (!parser) {
      return undefined;
    }

    const text = document.getText();
    const result = parser.parse(text);

    if (!result.ok) {
      return undefined;
    }

    // Find the block that contains the cursor position
    const lineNumberResult = LN.create(position.line);

    if (R.isOk(lineNumberResult)) {
      for (const block of result.value) {
        if (block.range.contains(lineNumberResult.value)) {
          return block.code as string;
        }
      }
    }

    // If no block contains the cursor, return the first block if any
    if (result.value.length > 0) {
      return result.value[0].code as string;
    }

    return undefined;
  }

  private getHtmlContent(webview: vscode.Webview, mermaidCode: string): string {
    if (!this.extensionUri) {
      return '';
    }
    return this.renderer.render(webview, mermaidCode, this.extensionUri);
  }
}
