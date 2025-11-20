import * as vscode from 'vscode';
import type { ICommentParser } from '../../domain/interfaces/ICommentParser';
import type { Language } from '../../domain/types/BrandedTypes';
import { GoCommentParser } from '../../infrastructure/parsers/GoCommentParser';
import { PythonCommentParser } from '../../infrastructure/parsers/PythonCommentParser';
import { RustCommentParser } from '../../infrastructure/parsers/RustCommentParser';
import { TypeScriptCommentParser } from '../../infrastructure/parsers/TypeScriptCommentParser';

export class MermaidHoverProvider implements vscode.HoverProvider {
  private readonly parsers: Map<Language, ICommentParser>;

  constructor() {
    console.log('[MermaidHoverProvider] Constructor called');
    this.parsers = new Map();
    this.parsers.set('typescript', new TypeScriptCommentParser());
    this.parsers.set('javascript', new TypeScriptCommentParser());
    this.parsers.set('go', new GoCommentParser());
    this.parsers.set('rust', new RustCommentParser());
    this.parsers.set('python', new PythonCommentParser());
    console.log('[MermaidHoverProvider] Parsers initialized:', Array.from(this.parsers.keys()));
  }

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    const language = document.languageId as Language;
    const parser = this.parsers.get(language);

    console.log('[MermaidHoverProvider] Language:', language);
    console.log('[MermaidHoverProvider] Position:', position.line, position.character);

    if (!parser) {
      console.log('[MermaidHoverProvider] No parser found for language:', language);
      return undefined;
    }

    const text = document.getText();
    const result = parser.parse(text);

    console.log('[MermaidHoverProvider] Parse result:', result);

    if (!result.ok) {
      console.log('[MermaidHoverProvider] Parse failed');
      return undefined;
    }

    console.log('[MermaidHoverProvider] Found blocks:', result.value.length);
    result.value.forEach((block, index) => {
      console.log(`[MermaidHoverProvider] Block ${index}:`, {
        start: block.range.start,
        end: block.range.end,
        code: block.code.substring(0, 50),
      });
    });

    // search for the block that contains the position
    for (const block of result.value) {
      console.log(
        '[MermaidHoverProvider] Checking block range:',
        block.range.start,
        '-',
        block.range.end,
        'against position:',
        position.line
      );
      if (block.range.contains(position.line)) {
        // TODO: Fix explicit any type casting
        console.log('[MermaidHoverProvider] Found matching block!');

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

    console.log('[MermaidHoverProvider] No matching block found');
    return undefined;
  }
}
