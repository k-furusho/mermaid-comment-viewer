import type { CodeRange } from '../../domain/entities/CodeRange';
import { CodeRange as CR } from '../../domain/entities/CodeRange';
import type { ICommentParser } from '../../domain/interfaces/ICommentParser';
import type { MermaidCode } from '../../domain/types/BrandedTypes';
import { LineNumber as LN, MermaidCode as MC } from '../../domain/types/BrandedTypes';
import type { Result } from '../../domain/types/Result';
import { Result as R } from '../../domain/types/Result';

class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export class PythonCommentParser implements ICommentParser {
  // Triple quotes docstring patterns (both """ and ''') - Support "mermaid", "@mermaid", and "Mermaid:"
  // Pattern allows any content before mermaid keyword (for docstrings with descriptions)
  private readonly doubleQuotePattern = /"""[\s\S]*?(?:@?mermaid|Mermaid:)\s*\n([\s\S]*?)"""/gi;
  private readonly singleQuotePattern = /'''[\s\S]*?(?:@?mermaid|Mermaid:)\s*\n([\s\S]*?)'''/gi;

  public parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, ParseError> {
    const results: Array<{ code: MermaidCode; range: CodeRange }> = [];

    try {
      // Parse double quote docstrings
      const doubleQuoteMatches = Array.from(text.matchAll(this.doubleQuotePattern));
      for (const match of doubleQuoteMatches) {
        const code = match[1];
        if (code) {
          this.processMatch(text, match, code, results);
        }
      }

      // Parse single quote docstrings
      const singleQuoteMatches = Array.from(text.matchAll(this.singleQuotePattern));
      for (const match of singleQuoteMatches) {
        const code = match[1];
        if (code) {
          this.processMatch(text, match, code, results);
        }
      }

      return R.ok(results);
    } catch (error) {
      return R.err(new ParseError(error instanceof Error ? error.message : 'Unknown parse error'));
    }
  }

  private processMatch(
    text: string,
    match: RegExpMatchArray,
    rawCode: string,
    results: Array<{ code: MermaidCode; range: CodeRange }>
  ): void {
    // Remove common leading indentation from all lines
    const lines = rawCode.split('\n');
    if (lines.length > 0) {
      // Find the minimum indentation (excluding empty lines)
      const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
      if (nonEmptyLines.length > 0) {
        const minIndent = Math.min(
          ...nonEmptyLines.map((line) => {
            const match = line.match(/^(\s*)/);
            return match ? match[1].length : 0;
          })
        );

        // Remove the common indentation from all lines
        if (minIndent > 0) {
          rawCode = lines.map((line) => line.slice(minIndent)).join('\n');
        }
      }
    }

    // trim the code and remove extra whitespace
    const code = rawCode.trim();
    const codeResult = MC.create(code);
    if (R.isOk(codeResult)) {
      const startLine = this.getLineNumber(text, match.index ?? 0);
      const endLine = this.getLineNumber(text, (match.index ?? 0) + match[0].length);

      const startLN = LN.create(startLine);
      const endLN = LN.create(endLine);

      if (R.isOk(startLN) && R.isOk(endLN)) {
        const rangeResult = CR.create(startLN.value, endLN.value);
        if (R.isOk(rangeResult)) {
          results.push({ code: codeResult.value, range: rangeResult.value });
        }
      }
    }
  }

  private getLineNumber(text: string, index: number): number {
    return text.substring(0, index).split('\n').length - 1;
  }
}
