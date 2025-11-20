import * as vscode from 'vscode';

import { WebviewService } from './infrastructure/services/WebviewService';
import { MermaidCodeLensProvider } from './presentation/providers/CodeLensProvider';
import { MermaidHoverProvider } from './presentation/providers/HoverProvider';

export function activate(context: vscode.ExtensionContext): void {
  // Initialize WebviewService with extension context
  WebviewService.getInstance().initialize(context);

  vscode.window.showInformationMessage('🎉 Mermaid Comment Viewer activated!');

  const supportedLanguages = ['typescript', 'javascript', 'python', 'go', 'rust'];

  // Hover Provider登録
  const hoverProvider = new MermaidHoverProvider();
  for (const language of supportedLanguages) {
    const disposable = vscode.languages.registerHoverProvider(language, hoverProvider);
    context.subscriptions.push(disposable);
    console.log(`[Extension] Registered hover provider for: ${language}`);
  }

  // CodeLens Provider登録
  const codeLensProvider = new MermaidCodeLensProvider();
  for (const language of supportedLanguages) {
    const disposable = vscode.languages.registerCodeLensProvider(
      { language: language },
      codeLensProvider
    );
    context.subscriptions.push(disposable);
    console.log(`[Extension] Registered CodeLens provider for: ${language}`);
  }

  const showPreviewCommand = vscode.commands.registerCommand(
    'mermaidInlineViewer.showPreview',
    (mermaidCode?: string) => {
      if (mermaidCode) {
        WebviewService.getInstance().showPreview(mermaidCode);
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
}

export function deactivate() {}
