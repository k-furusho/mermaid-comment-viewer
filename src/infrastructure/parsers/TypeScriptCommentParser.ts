import type { CodeRange } from '../../domain/entities/CodeRange';
import type { MermaidCode } from '../../domain/types/BrandedTypes';
import type { Result } from '../../domain/types/Result';
import { Result as R } from '../../domain/types/Result';
import { BaseCommentParser, ParseError } from './BaseCommentParser';

export class TypeScriptCommentParser extends BaseCommentParser {
  // Support "mermaid", "@mermaid", and "Mermaid:" patterns
  // Matches: /* mermaid ... */, /* @mermaid ... */, /** mermaid ... */, /** * @mermaid ... */
  // Also matches: /** * * @mermaid ... */ (multiple asterisks before @mermaid)
  // Also matches: /**\n * * @mermaid ... */ (with newline after /**)
  // Also matches: /** * Mermaid: ... */ (with Mermaid: keyword)
  private readonly blockCommentPattern =
    /\/\*\*?(?:\s*@?mermaid|[\s\S]*?(?:@mermaid|(?:\n\s*\*?\s*)(?:mermaid|Mermaid:)))\s*\n?([\s\S]*?)\*\//gi;

  public parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, ParseError> {
    try {
      const validation = this.validateTextLength(text);
      if (R.isErr(validation)) {
        return validation;
      }

      const results: Array<{ code: MermaidCode; range: CodeRange }> = [];
      const blockMatches = this.getMatches(text);

      if (R.isErr(blockMatches)) {
        return blockMatches;
      }

      const matches = blockMatches.ok ? blockMatches.value : [];

      for (const match of matches) {
        if (!match || match.index === undefined || !match[0] || !match[1]) {
          continue;
        }

        const rawCode = match[1];
        if (!rawCode) continue;

        const result = this.processMatchResult(text, match, rawCode);
        if (result) {
          results.push(result);
        }
      }

      return R.ok(results);
    } catch (error) {
      return R.err(new ParseError(error instanceof Error ? error.message : 'Unknown parse error'));
    }
  }

  private getMatches(text: string): Result<RegExpMatchArray[], ParseError> {
    try {
      this.blockCommentPattern.lastIndex = 0;
      const matches = Array.from(text.matchAll(this.blockCommentPattern));
      return R.ok(matches);
    } catch (regexError) {
      return R.err(
        new ParseError(
          `Regex error: ${regexError instanceof Error ? regexError.message : 'Unknown regex error'}`
        )
      );
    } finally {
      this.blockCommentPattern.lastIndex = 0;
    }
  }

  /**
   * Override cleanCode to handle asterisks in block comments specifically for JS/TS
   */
  protected override cleanCode(rawCode: string): string {
    // First, strip the leading asterisks and whitespace
    const lines = rawCode.split('\n');
    const strippedLines = lines.map((line) => line.replace(/^\s*\*\s?/, '').trimEnd());

    // Then use the base logic to extract Mermaid block
    return this.extractMermaidBlock(strippedLines);
  }
}
