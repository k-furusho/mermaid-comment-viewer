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
  // Triple quotes docstring patterns (both """ and ''')
  private readonly doubleQuotePattern = /"""\s*mermaid\s*\n([\s\S]*?)"""/g;
  private readonly singleQuotePattern = /'''\s*mermaid\s*\n([\s\S]*?)'''/g;

  public parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, ParseError> {
    const results: Array<{ code: MermaidCode; range: CodeRange }> = [];

    try {
      // Double quote docstring解析
      const doubleQuoteMatches = Array.from(text.matchAll(this.doubleQuotePattern));
      for (const match of doubleQuoteMatches) {
        const code = match[1];
        if (code) {
          this.processMatch(text, match, code, results);
        }
      }

      // Single quote docstring解析
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
