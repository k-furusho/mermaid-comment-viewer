import * as vscode from 'vscode';
import type { Language } from '../../domain/types/BrandedTypes';
import type { ICommentParser } from '../../domain/interfaces/ICommentParser';
import { TypeScriptCommentParser } from '../../infrastructure/parsers/TypeScriptCommentParser';
import { GoCommentParser } from '../../infrastructure/parsers/GoCommentParser';
import { RustCommentParser } from '../../infrastructure/parsers/RustCommentParser';
import { PythonCommentParser } from '../../infrastructure/parsers/PythonCommentParser';

export class MermaidCodeLensProvider implements vscode.CodeLensProvider {
  private readonly parsers: Map<Language, ICommentParser>;

  constructor() {
    console.log('[MermaidCodeLensProvider] Constructor called');
    this.parsers = new Map();
    this.parsers.set('typescript', new TypeScriptCommentParser());
    this.parsers.set('javascript', new TypeScriptCommentParser());
    this.parsers.set('go', new GoCommentParser());
    this.parsers.set('rust', new RustCommentParser());
    this.parsers.set('python', new PythonCommentParser());
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
        arguments: [block.code]
      };

      codeLenses.push(new vscode.CodeLens(range, command));
    }

    console.log('[MermaidCodeLensProvider] Provided', codeLenses.length, 'code lenses');
    return codeLenses;
  }
}

