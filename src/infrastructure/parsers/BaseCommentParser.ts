import type { CodeRange } from '../../domain/entities/CodeRange';
import { CodeRange as CR } from '../../domain/entities/CodeRange';
import type { ICommentParser } from '../../domain/interfaces/ICommentParser';
import type { MermaidCode } from '../../domain/types/BrandedTypes';
import { LineNumber as LN, MermaidCode as MC } from '../../domain/types/BrandedTypes';
import type { Result } from '../../domain/types/Result';
import { Result as R } from '../../domain/types/Result';

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Abstract base class for comment parsers.
 * Implements common logic for extracting Mermaid code from comments,
 * handling safety checks, and creating code ranges.
 */
export abstract class BaseCommentParser implements ICommentParser {
  protected readonly mermaidStartPatterns = [
    /^(graph|flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram|gantt|pie|gitgraph|journey|requirement|C4Context|C4Container|C4Component|mindmap|timeline|sankey-beta|quadrantChart)/i,
    /^%%\{/,
    /^%%/,
  ];

  protected readonly docPatterns = [
    /^(セキュリティ考慮事項|Security|環境変数|Environment|使用方法|Usage|CSVフォーマット|CSV Format|注意事項|Notes?|参考|References?):/i,
    /^##?\s+/,
    /^[A-Z][a-z]+:/, // Section headers like "Usage:", "Note:"
  ];

  /**
   * Parse the text to find Mermaid diagrams.
   * This method must be implemented by subclasses to define language-specific parsing logic.
   */
  public abstract parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, ParseError>;

  /**
   * Validate the text length to prevent regex DoS attacks.
   */
  protected validateTextLength(text: string): Result<void, ParseError> {
    if (text.length > 1_000_000) {
      return R.err(new ParseError('Text too long to parse safely'));
    }
    return R.ok(undefined);
  }

  /**
   * Clean the extracted code by removing common indentation,
   * detecting Mermaid start, and removing subsequent documentation.
   */
  protected cleanCode(rawCode: string): string {
    const lines = rawCode.split('\n');

    // 1. Remove common indentation
    const cleanedLines = this.removeCommonIndentation(lines);

    // 2. Extract Mermaid code block
    return this.extractMermaidBlock(cleanedLines);
  }

  /**
   * Remove common indentation from lines.
   * Can be overridden by subclasses if specific comment characters need to be stripped first.
   */
  protected removeCommonIndentation(lines: string[]): string[] {
    if (lines.length === 0) return lines;

    // Filter out empty lines for indentation calculation
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
    if (nonEmptyLines.length === 0) return lines;

    const minIndent = Math.min(
      ...nonEmptyLines.map((line) => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      })
    );

    if (minIndent > 0) {
      return lines.map((line) => line.slice(minIndent));
    }

    return lines;
  }

  /**
   * Extract the Mermaid code block from lines, handling start patterns and documentation headers.
   */
  protected extractMermaidBlock(lines: string[]): string {
    const mermaidLines: string[] = [];
    let foundMermaidStart = false;
    let emptyLineCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!foundMermaidStart) {
        if (trimmedLine === '') continue;
        if (this.isMermaidStart(trimmedLine)) {
          foundMermaidStart = true;
          mermaidLines.push(line);
          emptyLineCount = 0;
        }
        continue;
      }

      if (this.isDocHeader(trimmedLine)) {
        break;
      }

      if (trimmedLine === '') {
        emptyLineCount++;
        if (emptyLineCount >= 2) {
          break;
        }
        mermaidLines.push(line);
      } else {
        emptyLineCount = 0;
        mermaidLines.push(line);
      }
    }

    if (foundMermaidStart && mermaidLines.length > 0) {
      return mermaidLines.join('\n').trim();
    }

    // Fallback: return trimmed code if no explicit start pattern found
    // This maintains backward compatibility for simple blocks
    return lines.join('\n').trim();
  }

  protected isMermaidStart(line: string): boolean {
    return this.mermaidStartPatterns.some(pattern => pattern.test(line));
  }

  protected isDocHeader(line: string): boolean {
    return this.docPatterns.some(pattern => pattern.test(line));
  }

  protected isInvalidCode(code: string): boolean {
    if (!code || code.length < 3) return true;
    if (code.includes('"mermaidInlineViewer') || code.includes('": {')) return true;
    return false;
  }

  protected createCodeRange(text: string, matchIndex: number, matchLength: number): Result<CodeRange, ParseError> {
    if (matchIndex < 0 || matchIndex >= text.length || matchLength <= 0) {
      return R.err(new ParseError('Invalid match index'));
    }

    const startLine = this.getLineNumber(text, matchIndex);
    const endLine = this.getLineNumber(text, matchIndex + matchLength);

    const startLN = LN.create(startLine);
    const endLN = LN.create(endLine);

    if (R.isOk(startLN) && R.isOk(endLN)) {
      const rangeResult = CR.create(startLN.value, endLN.value);
      if (R.isOk(rangeResult)) {
        return R.ok(rangeResult.value);
      }
    }

    return R.err(new ParseError('Failed to create CodeRange'));
  }

  protected getLineNumber(text: string, index: number): number {
    return text.substring(0, index).split('\n').length - 1;
  }

  /**
   * Helper to process a regex match and create a result object.
   */
  protected processMatchResult(
    text: string,
    match: RegExpMatchArray,
    rawCode: string
  ): { code: MermaidCode; range: CodeRange } | null {
    if (!match || match.index === undefined) {
      return null;
    }

    const cleanedCode = this.cleanCode(rawCode);

    if (this.isInvalidCode(cleanedCode)) {
      return null;
    }

    const codeResult = MC.create(cleanedCode);
    if (R.isErr(codeResult)) {
      return null;
    }

    const rangeResult = this.createCodeRange(text, match.index, match[0].length);
    if (R.isErr(rangeResult)) {
      return null;
    }

    // Safety check: Explicitly verify ok state for TS compiler (though implied by isErr check above)
    if (!rangeResult.ok || !codeResult.ok) {
       return null;
    }

    return { code: codeResult.value, range: rangeResult.value };
  }
}

