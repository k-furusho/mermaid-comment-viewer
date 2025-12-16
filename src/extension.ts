import * as vscode from 'vscode';

import { WebviewService } from './infrastructure/services/WebviewService';
import { MermaidCodeLensProvider } from './presentation/providers/CodeLensProvider';
import { MermaidHoverProvider } from './presentation/providers/HoverProvider';

export function activate(context: vscode.ExtensionContext): void {
  // Initialize WebviewService with extension context
  WebviewService.getInstance().initialize(context);

  vscode.window.showInformationMessage('🎉 Mermaid Comment Viewer activated!');

  const supportedLanguages = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'python', 'go', 'rust'];

  // Register Hover Provider
  const hoverProvider = new MermaidHoverProvider();
  for (const language of supportedLanguages) {
    const disposable = vscode.languages.registerHoverProvider(language, hoverProvider);
    context.subscriptions.push(disposable);
  }

  // Register CodeLens Provider
  const codeLensProvider = new MermaidCodeLensProvider();
  for (const language of supportedLanguages) {
    const disposable = vscode.languages.registerCodeLensProvider(
      { language: language },
      codeLensProvider
    );
    context.subscriptions.push(disposable);
  }

  const showPreviewCommand = vscode.commands.registerCommand(
    'mermaidInlineViewer.showPreview',
    (mermaidCode?: string, document?: vscode.TextDocument) => {
      if (mermaidCode) {
        // Use provided document or fall back to active editor
        const doc = document || vscode.window.activeTextEditor?.document;
        WebviewService.getInstance().showPreview(mermaidCode, doc);
      } else {
        vscode.window.showWarningMessage('No Mermaid code provided');
      }
    }
  );

  context.subscriptions.push(showPreviewCommand);

  const refreshPreviewCommand = vscode.commands.registerCommand(
    'mermaidInlineViewer.refreshPreview',
    () => {
      WebviewService.getInstance().refresh();
    }
  );
  context.subscriptions.push(refreshPreviewCommand);

  // Real-time update: Monitor document changes and cursor position
  const webviewService = WebviewService.getInstance();
  let updateTimeout: NodeJS.Timeout | undefined;

  // Debounce function to avoid too frequent updates
  const debouncedUpdate = (document: vscode.TextDocument, position: vscode.Position) => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    updateTimeout = setTimeout(() => {
      webviewService.updateFromCursorPosition(document, position);
    }, 300); // 300ms debounce
  };

  // Monitor document changes
  const changeDocumentDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const activeEditor = vscode.window.activeTextEditor;
    if (
      activeEditor &&
      activeEditor.document.uri.toString() === event.document.uri.toString() &&
      webviewService.hasActivePanel()
    ) {
      const position = activeEditor.selection.active;
      debouncedUpdate(event.document, position);
    }
  });

  // Monitor cursor position changes
  const changeSelectionDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
    if (webviewService.hasActivePanel()) {
      const document = event.textEditor.document;
      const position = event.selections[0]?.active;
      if (position) {
        debouncedUpdate(document, position);
      }
    }
  });

  // Monitor active editor changes
  const changeActiveEditorDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && webviewService.hasActivePanel()) {
      const position = editor.selection.active;
      debouncedUpdate(editor.document, position);
    }
  });

  context.subscriptions.push(
    changeDocumentDisposable,
    changeSelectionDisposable,
    changeActiveEditorDisposable
  );
}

export function deactivate() {}
