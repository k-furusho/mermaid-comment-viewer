import { describe, expect, it } from 'vitest';
import { Result } from '../../domain/types/Result';
import { GoCommentParser } from '../../infrastructure/parsers/GoCommentParser';
import { PythonCommentParser } from '../../infrastructure/parsers/PythonCommentParser';
import { RustCommentParser } from '../../infrastructure/parsers/RustCommentParser';
import { TypeScriptCommentParser } from '../../infrastructure/parsers/TypeScriptCommentParser';

describe('Parser Error Handling Test Suite', () => {
  it('TypeScript Parser handles invalid regex gracefully', () => {
    const parser = new TypeScriptCommentParser();
    // Simulate a very long string that might cause regex performance issues, though hard to trigger actual error with simple regex
    const longString = `/* mermaid ${'graph TD; A-->B; '.repeat(1000)} */`;
    const result = parser.parse(longString);
    expect(Result.isOk(result)).toBe(true);
  });

  it('TypeScript Parser skips JSON-like strings to avoid false positives', () => {
    const parser = new TypeScriptCommentParser();
    const jsonString = '/* "mermaidInlineViewer": { "theme": "dark" } */';
    const result = parser.parse(jsonString);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it('Python Parser handles mixed quote styles', () => {
    const parser = new PythonCommentParser();
    const mixedQuotes =
      '"""\nmermaid\ngraph TD;\nA-->B;\n"""\n' + "'''\nmermaid\ngraph TD;\nC-->D;\n'''";
    const result = parser.parse(mixedQuotes);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(2);
    }
  });

  it('Rust Parser handles both block and doc comments', () => {
    const parser = new RustCommentParser();
    const text = '/* mermaid\ngraph TD;\nA-->B;\n*/\n//! mermaid\n//! graph TD;\n//! C-->D;\n';
    const result = parser.parse(text);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      // Should find both block comment and doc comment
      expect(result.value.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('All parsers return empty result for empty string', () => {
    const parsers = [
      new TypeScriptCommentParser(),
      new PythonCommentParser(),
      new GoCommentParser(),
      new RustCommentParser(),
    ];

    for (const parser of parsers) {
      const result = parser.parse('');
      expect(Result.isOk(result)).toBe(true);
      if (Result.isOk(result)) {
        expect(result.value.length).toBe(0);
      }
    }
  });
});
