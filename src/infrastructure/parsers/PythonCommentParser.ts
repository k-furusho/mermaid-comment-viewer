import type { CodeRange } from '../../domain/entities/CodeRange';
import type { MermaidCode } from '../../domain/types/BrandedTypes';
import type { Result } from '../../domain/types/Result';
import { Result as R } from '../../domain/types/Result';
import { BaseCommentParser, ParseError } from './BaseCommentParser';

export class PythonCommentParser extends BaseCommentParser {
  // Triple quotes docstring patterns (both """ and ''') - Support "mermaid", "@mermaid", and "Mermaid:"
  // Pattern allows any content before mermaid keyword (for docstrings with descriptions)
  // Uses (?:[^"]|"(?!""))*? to avoid crossing docstring boundaries
  private readonly doubleQuotePattern =
    /"""(?:[^"]|"(?!""))*?(?:@?mermaid|Mermaid:)\s*\n((?:[^"]|"(?!""))*?)"""/gi;
  private readonly singleQuotePattern =
    /'''(?:[^']|'(?!''))*?(?:@?mermaid|Mermaid:)\s*\n((?:[^']|'(?!''))*?)'''/gi;

  public parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, ParseError> {
    try {
      const validation = this.validateTextLength(text);
      if (R.isErr(validation)) {
        return validation;
      }

      const results: Array<{ code: MermaidCode; range: CodeRange }> = [];

      // Parse double quote docstrings
      const doubleQuoteMatches = Array.from(text.matchAll(this.doubleQuotePattern));
      for (const match of doubleQuoteMatches) {
        if (!match[1]) continue;
        const result = this.processMatchResult(text, match, match[1]);
        if (result) {
          results.push(result);
        }
      }

      // Parse single quote docstrings
      const singleQuoteMatches = Array.from(text.matchAll(this.singleQuotePattern));
      for (const match of singleQuoteMatches) {
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
}
