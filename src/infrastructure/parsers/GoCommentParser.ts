import type { CodeRange } from '../../domain/entities/CodeRange';
import type { MermaidCode } from '../../domain/types/BrandedTypes';
import type { Result } from '../../domain/types/Result';
import { Result as R } from '../../domain/types/Result';
import { BaseCommentParser, ParseError } from './BaseCommentParser';

export class GoCommentParser extends BaseCommentParser {
  // Block comment pattern for Go - Support "mermaid", "@mermaid", and "Mermaid:"
  // Matches: /* mermaid ... */, /* @mermaid ... */, /*\n * @mermaid ... */
  // Uses (?:[^*]|\*(?!\/))*? to avoid crossing comment boundaries
  private readonly blockCommentPattern =
    /\/\*(?:\s*@?mermaid|(?:[^*]|\*(?!\/))*?(?:@mermaid|(?:\n\s*\*?\s*)(?:mermaid|Mermaid:)))\s*\n?((?:[^*]|\*(?!\/))*?)\*\//gi;

  public parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, ParseError> {
    try {
      const validation = this.validateTextLength(text);
      if (R.isErr(validation)) {
        return validation;
      }

      const results: Array<{ code: MermaidCode; range: CodeRange }> = [];
      const blockMatches = Array.from(text.matchAll(this.blockCommentPattern));

      for (const match of blockMatches) {
        if (!match[1]) continue;
        const result = this.processMatchResult(text, match, match[1]);
        if (result) {
          results.push(result);
        }
      }

      return R.ok(results);
    } catch (error) {
      return R.err(new ParseError(error instanceof Error ? error.message : 'Unknown parse error'));
    }
  }

  protected override cleanCode(rawCode: string): string {
    // Similar to TypeScript, strip leading asterisks
    const lines = rawCode.split('\n');
    const strippedLines = lines.map((line) => line.replace(/^\s*\*\s?/, '').trimEnd());

    return this.extractMermaidBlock(strippedLines);
  }
}
