import { describe, expect, it } from 'vitest';
import type { CodeRange } from '../../domain/entities/CodeRange';
import type { MermaidCode } from '../../domain/types/BrandedTypes';
import { Result } from '../../domain/types/Result';
import { BaseCommentParser, ParseError } from '../../infrastructure/parsers/BaseCommentParser';

// Concrete implementation for testing
class TestParser extends BaseCommentParser {
  public parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, ParseError> {
    // Basic implementation for testing helper methods
    try {
      const validation = this.validateTextLength(text);
      if (Result.isErr(validation)) return validation;

      return Result.ok([]);
    } catch (_e) {
      return Result.err(new ParseError('Test error'));
    }
  }

  // Expose protected methods for testing
  public testCleanCode(rawCode: string): string {
    return this.cleanCode(rawCode);
  }

  public testRemoveCommonIndentation(lines: string[]): string[] {
    return this.removeCommonIndentation(lines);
  }

  public testExtractMermaidBlock(lines: string[]): string {
    return this.extractMermaidBlock(lines);
  }

  public testIsMermaidStart(line: string): boolean {
    return this.isMermaidStart(line);
  }

  public testIsDocHeader(line: string): boolean {
    return this.isDocHeader(line);
  }

  public testIsInvalidCode(code: string): boolean {
    return this.isInvalidCode(code);
  }
}

describe('BaseCommentParser Test Suite', () => {
  const parser = new TestParser();

  describe('Validation', () => {
    it('should validate text length', () => {
      const shortText = 'short text';
      expect(Result.isOk(parser.parse(shortText))).toBe(true);

      const longText = 'a'.repeat(1_000_001);
      const result = parser.parse(longText);
      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.error.message).toBe('Text too long to parse safely');
      }
    });
  });

  describe('Indent Removal', () => {
    it('should remove common indentation', () => {
      const lines = ['    line 1', '    line 2', '      nested'];
      const result = parser.testRemoveCommonIndentation(lines);
      expect(result).toEqual(['line 1', 'line 2', '  nested']);
    });

    it('should handle mixed indentation levels', () => {
      const lines = [
        '  line 1',
        '    line 2',
        ' line 3', // 1 space
      ];
      const result = parser.testRemoveCommonIndentation(lines);
      expect(result).toEqual([
        ' line 1', // 1 space removed
        '   line 2',
        'line 3',
      ]);
    });

    it('should ignore empty lines when calculating indentation', () => {
      const lines = ['    line 1', '', '    line 2'];
      const result = parser.testRemoveCommonIndentation(lines);
      expect(result).toEqual(['line 1', '', 'line 2']);
    });
  });

  describe('Mermaid Extraction', () => {
    it('should extract simple mermaid block', () => {
      const lines = ['graph TD', 'A-->B'];
      const result = parser.testExtractMermaidBlock(lines);
      expect(result).toBe('graph TD\nA-->B');
    });

    it('should identify mermaid start patterns', () => {
      expect(parser.testIsMermaidStart('graph TD')).toBe(true);
      expect(parser.testIsMermaidStart('sequenceDiagram')).toBe(true);
      expect(parser.testIsMermaidStart('%%{init: {}}%%')).toBe(true);
      expect(parser.testIsMermaidStart('not mermaid')).toBe(false);
    });

    it('should identify doc headers', () => {
      expect(parser.testIsDocHeader('Usage:')).toBe(true);
      expect(parser.testIsDocHeader('Security Considerations:')).toBe(true);
      expect(parser.testIsDocHeader('## Header')).toBe(true);
      expect(parser.testIsDocHeader('Normal text')).toBe(false);
    });

    it('should extract code until doc header', () => {
      const lines = ['graph TD', 'A-->B', '', 'Usage:', 'Run command'];
      const result = parser.testExtractMermaidBlock(lines);
      expect(result).toBe('graph TD\nA-->B');
    });

    it('should extract code until consecutive empty lines', () => {
      const lines = ['graph TD', 'A-->B', '', '', 'Some other text'];
      const result = parser.testExtractMermaidBlock(lines);
      expect(result).toBe('graph TD\nA-->B');
    });
  });

  describe('Code Validation', () => {
    it('should reject invalid code', () => {
      expect(parser.testIsInvalidCode('')).toBe(true);
      expect(parser.testIsInvalidCode('ab')).toBe(true); // Too short
      expect(parser.testIsInvalidCode('"mermaidInlineViewer": {')).toBe(true); // JSON config
      expect(parser.testIsInvalidCode('graph TD')).toBe(false);
    });
  });
});
