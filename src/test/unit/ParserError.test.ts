import * as assert from 'assert';
import { TypeScriptCommentParser } from '../../src/infrastructure/parsers/TypeScriptCommentParser';
import { PythonCommentParser } from '../../src/infrastructure/parsers/PythonCommentParser';
import { GoCommentParser } from '../../src/infrastructure/parsers/GoCommentParser';
import { RustCommentParser } from '../../src/infrastructure/parsers/RustCommentParser';
import { Result } from '../../src/domain/types/Result';

suite('Parser Error Handling Test Suite', () => {
  test('TypeScript Parser handles invalid regex gracefully', () => {
    const parser = new TypeScriptCommentParser();
    // Simulate a very long string that might cause regex performance issues, though hard to trigger actual error with simple regex
    const longString = '/* mermaid ' + 'graph TD; A-->B; '.repeat(1000) + ' */';
    const result = parser.parse(longString);
    assert.ok(Result.isOk(result));
  });

  test('TypeScript Parser skips JSON-like strings to avoid false positives', () => {
    const parser = new TypeScriptCommentParser();
    const jsonString = '/* "mermaidInlineViewer": { "theme": "dark" } */';
    const result = parser.parse(jsonString);
    assert.ok(Result.isOk(result));
    if (Result.isOk(result)) {
      assert.strictEqual(result.value.length, 0, 'Should not parse JSON settings as mermaid code');
    }
  });

  test('Python Parser handles mixed quote styles', () => {
    const parser = new PythonCommentParser();
    const mixedQuotes = '"""\nmermaid\ngraph TD;\nA-->B;\n"""\n' + "'''\nmermaid\ngraph TD;\nC-->D;\n'''";
    const result = parser.parse(mixedQuotes);
    assert.ok(Result.isOk(result));
    if (Result.isOk(result)) {
      assert.strictEqual(result.value.length, 2);
    }
  });

  test('Rust Parser handles both block and doc comments', () => {
    const parser = new RustCommentParser();
    const text = '/* mermaid\ngraph TD;\nA-->B;\n*/\n//! mermaid\n//! graph TD;\n//! C-->D;';
    const result = parser.parse(text);
    assert.ok(Result.isOk(result));
    if (Result.isOk(result)) {
      assert.strictEqual(result.value.length, 2);
    }
  });

  test('All parsers return empty result for empty string', () => {
    const parsers = [
      new TypeScriptCommentParser(),
      new PythonCommentParser(),
      new GoCommentParser(),
      new RustCommentParser()
    ];

    for (const parser of parsers) {
      const result = parser.parse('');
      assert.ok(Result.isOk(result));
      if (Result.isOk(result)) {
        assert.strictEqual(result.value.length, 0);
      }
    }
  });
});

