import type { MermaidCode, LineNumber } from '../../domain/types/BrandedTypes';
import { MermaidCode as MC } from '../../domain/types/BrandedTypes';
import { LineNumber as LN } from '../../domain/types/BrandedTypes';
import type { CodeRange } from '../../domain/entities/CodeRange';
import { CodeRange as CR } from '../../domain/entities/CodeRange';
import type { Result } from '../../domain/types/Result';
import { Result as R } from '../../domain/types/Result';
import type { ICommentParser } from '../../domain/interfaces/ICommentParser';

class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export class TypeScriptCommentParser implements ICommentParser {
  private readonly blockCommentPattern = /\/\*\s*mermaid\s*([\s\S]*?)\*\//gi;
  private readonly docCommentPattern = /\/\*\*\s*mermaid\s*((?:\s*\*.*\n)+)\s*\*\//gi;

  public parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, ParseError> {
    try {
      // block comment pattern
      const blockMatches = Array.from(text.matchAll(this.blockCommentPattern));

      for (const match of blockMatches) {
        const rawCode = match[1];
        console.log('[TypeScriptCommentParser] Raw match code:', rawCode);

        if (rawCode) {
          // trim the code and remove extra whitespace
          const code = rawCode.trim();

          // skip invalid Mermaid code (contains JSON syntax)
          if (code.includes('"mermaidInlineViewer') || code.includes('": {')) {
            console.warn('[TypeScriptCommentParser] Skipping invalid Mermaid code (contains JSON syntax)');
            continue;
          }

          const codeResult = MC.create(code);
          if (R.isOk(codeResult)) {
            const startLine = this.getLineNumber(text, match.index ?? 0);
            const endLine = this.getLineNumber(text, (match.index ?? 0) + match[0].length - 1);

            console.log('[TypeScriptCommentParser] Line range:', startLine, '-', endLine);

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

      console.log('[TypeScriptCommentParser] Total results:', results.length);
      return R.ok(results);
    } catch (error) {
      return R.err(new ParseError(error instanceof Error ? error.message : 'Unknown parse error'));
    }
  }

  private getLineNumber(text: string, index: number): number {
    return text.substring(0, index).split('\n').length - 1;
  }
}