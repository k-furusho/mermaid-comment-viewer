import * as vscode from 'vscode';
import type { ICommentParser } from '../../domain/interfaces/ICommentParser';
import type { Language } from '../../domain/types/BrandedTypes';
import { LineNumber as LN } from '../../domain/types/BrandedTypes';
import { Result as R } from '../../domain/types/Result';
import { ParserFactory } from '../../infrastructure/factories/ParserFactory';

export class MermaidHoverProvider implements vscode.HoverProvider {
  private readonly parsers: Map<Language, ICommentParser>;

  constructor() {
    this.parsers = ParserFactory.getParsers();
  }

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    const language = document.languageId as Language;
    const parser = this.parsers.get(language);

    if (!parser) {
      return undefined;
    }

    const text = document.getText();
    const result = parser.parse(text);

    if (!result.ok) {
      return undefined;
    }

    // search for the block that contains the position
    for (const block of result.value) {
      const lineNumberResult = LN.create(position.line);
      if (R.isOk(lineNumberResult) && block.range.contains(lineNumberResult.value)) {
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.appendMarkdown('**📊 Mermaid Diagram**\n\n');
        markdown.appendMarkdown(
          '_Click "Preview Mermaid Diagram" above to see the rendered diagram_\n\n'
        );
        markdown.appendCodeblock(block.code as string, 'mermaid');

        return new vscode.Hover(markdown);
      }
    }

    return undefined;
  }
}
