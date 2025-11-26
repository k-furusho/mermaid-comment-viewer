import * as vscode from 'vscode';
import type { ICommentParser } from '../../domain/interfaces/ICommentParser';
import type { Language } from '../../domain/types/BrandedTypes';
import { ParserFactory } from '../../infrastructure/factories/ParserFactory';

export class MermaidCodeLensProvider implements vscode.CodeLensProvider {
  private readonly parsers: Map<Language, ICommentParser>;

  constructor() {
    this.parsers = ParserFactory.getParsers();
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    const language = document.languageId as Language;
    const parser = this.parsers.get(language);

    if (!parser) {
      return [];
    }

    const text = document.getText();
    const result = parser.parse(text);

    if (!result.ok) {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];

    for (const block of result.value) {
      const range = new vscode.Range(
        new vscode.Position(block.range.start as number, 0),
        new vscode.Position(block.range.end as number, 0)
      );

      const command: vscode.Command = {
        title: '$(open-preview) Preview Mermaid Diagram',
        command: 'mermaidInlineViewer.showPreview',
        arguments: [block.code],
      };

      codeLenses.push(new vscode.CodeLens(range, command));
    }

    return codeLenses;
  }
}
