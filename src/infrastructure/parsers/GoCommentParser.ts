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

export class GoCommentParser implements ICommentParser {
  // Block comment pattern for Go - Support both "mermaid" and "@mermaid"
  // Matches: /* mermaid ... */, /* @mermaid ... */, /*\n * @mermaid ... */
  private readonly blockCommentPattern =
    /\/\*(?:\s*\n\s*(?:\*\s*)*)?@?mermaid\s*\n?([\s\S]*?)\*\//g;

  public parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, ParseError> {
    const results: Array<{ code: MermaidCode; range: CodeRange }> = [];

    try {
      // Parse block comments
      const blockMatches = Array.from(text.matchAll(this.blockCommentPattern));
      for (const match of blockMatches) {
        let rawCode = match[1];
        if (rawCode) {
          // Remove leading asterisks and whitespace from each line
          rawCode = rawCode
            .split('\n')
            .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
            .join('\n');

          // Trim code and remove extra whitespace
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
      }

      return R.ok(results);
    } catch (error) {
      return R.err(new ParseError(error instanceof Error ? error.message : 'Unknown parse error'));
    }
  }

  private getLineNumber(text: string, index: number): number {
    return text.substring(0, index).split('\n').length - 1;
  }
}
