import type { CodeRange } from '../../domain/entities/CodeRange';
import type { MermaidCode } from '../../domain/types/BrandedTypes';
import type { Result } from '../../domain/types/Result';
import { Result as R } from '../../domain/types/Result';
import { BaseCommentParser, ParseError } from './BaseCommentParser';

export class RustCommentParser extends BaseCommentParser {
  // Block comment pattern for Rust - Support "mermaid", "@mermaid", and "Mermaid:"
  // Matches: /* mermaid ... */, /* @mermaid ... */, /*\n * @mermaid ... */
  // Uses (?:[^*]|\*(?!\/))*? to avoid crossing comment boundaries
  private readonly blockCommentPattern =
    /\/\*(?:\s*@?mermaid|(?:[^*]|\*(?!\/))*?(?:@mermaid|(?:\n\s*\*?\s*)(?:mermaid|Mermaid:)))\s*\n?((?:[^*]|\*(?!\/))*?)\*\//gi;

  // Doc comment pattern for Rust (//! style) - Support "mermaid", "@mermaid", and "Mermaid:"
  private readonly docCommentPattern = /\/\/!\s*(?:@?mermaid|Mermaid:)\s*\n((?:\/\/!.*\n)+)/gi;

  public parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, ParseError> {
    try {
      const validation = this.validateTextLength(text);
      if (R.isErr(validation)) {
        return validation;
      }

      const results: Array<{ code: MermaidCode; range: CodeRange }> = [];

      // Parse block comments
      const blockMatches = Array.from(text.matchAll(this.blockCommentPattern));
      for (const match of blockMatches) {
        if (!match[1]) continue;
        const result = this.processMatchResult(text, match, match[1]);
        if (result) {
          results.push(result);
        }
      }

      // Parse doc comments
      const docMatches = Array.from(text.matchAll(this.docCommentPattern));
      for (const match of docMatches) {
        let code = match[1];
        if (code) {
          // Special handling for doc comments: remove //! prefix BEFORE standard cleaning
          code = code
            .split('\n')
            .map((line) => line.replace(/^\/\/!\s?/, ''))
            .join('\n');

          // Note: match.index might need adjustment if we were stricter, but for ranges it's usually fine
          // provided we map back to original text lines.
          // However, standard processMatchResult calls cleanCode again.
          // Since we already cleaned the prefixes, standard cleanCode will just do indentation and mermaid block extraction.

          const result = this.processMatchResult(text, match, code);
          if (result) {
            results.push(result);
          }
        }
      }

      return R.ok(results);
    } catch (error) {
      return R.err(new ParseError(error instanceof Error ? error.message : 'Unknown parse error'));
    }
  }

  protected override cleanCode(rawCode: string): string {
    // For block comments, strip asterisks.
    // For doc comments, we already stripped //! in the loop, so this regex won't match much there, which is fine.
    const lines = rawCode.split('\n');
    const strippedLines = lines.map((line) => line.replace(/^\s*\*\s?/, '').trimEnd());

    return this.extractMermaidBlock(strippedLines);
  }
}
