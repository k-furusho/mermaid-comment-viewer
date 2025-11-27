import { describe, it, expect } from 'vitest';
import { Result } from '../../domain/types/Result';
import { PythonCommentParser } from '../../infrastructure/parsers/PythonCommentParser';

describe('PythonCommentParser Test Suite', () => {
  const parser = new PythonCommentParser();

  it('should parse basic mermaid docstring with double quotes', () => {
    const code = `"""
mermaid
graph TD
    A[Start] --> B[End]
"""`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toBe('graph TD\n    A[Start] --> B[End]');
    }
  });

  it('should parse @mermaid annotation format with double quotes', () => {
    const code = `"""
@mermaid
graph TD
    A[Start] --> B[End]
"""`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toBe('graph TD\n    A[Start] --> B[End]');
    }
  });

  it('should parse basic mermaid docstring with single quotes', () => {
    const code = `'''
mermaid
sequenceDiagram
    Alice->>Bob: Hello
    Bob->>Alice: Hi there!
'''`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toContain('sequenceDiagram');
      expect(result.value[0].code).toContain('Alice->>Bob');
    }
  });

  it('should parse @mermaid annotation format with single quotes', () => {
    const code = `'''
@mermaid
sequenceDiagram
    Alice->>Bob: Hello
'''`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toContain('sequenceDiagram');
    }
  });

  it('should parse multiple mermaid blocks with different quote styles', () => {
    const code = `"""
mermaid
graph TD
    A --> B
"""
def func1():
    pass

'''
@mermaid
sequenceDiagram
    A->>B: Message
'''
def func2():
    pass`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(2);
      expect(result.value[0].code).toContain('graph TD');
      expect(result.value[1].code).toContain('sequenceDiagram');
    }
  });

  it('should handle mermaid code with complex diagram', () => {
    const code = `"""
mermaid
graph LR
    A[Client] --> B[API Server]
    B --> C[Database]
    B --> D[Cache]
    D --> C
    style A fill:#e1f5
    style B fill:#fff4e6
    style C fill:#f3e5f5
    style D fill:#e8f5e9
"""`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('graph LR');
      expect(mermaidCode).toContain('A[Client]');
      expect(mermaidCode).toContain('B[API Server]');
      expect(mermaidCode).toContain('style');
    }
  });

  it('should return empty result for empty string', () => {
    const result = parser.parse('');
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it('should return empty result when no mermaid docstring found', () => {
    const code = `"""
This is a regular docstring
without mermaid code
"""`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it('should parse Mermaid: format with double quotes', () => {
    const code = `"""
    決済処理のメインフローを実行する。

    Mermaid:
    graph TD
    Start[開始] --> Validate{有効性確認}
    Validate -- OK --> Charge[課金実行]
    Validate -- NG --> Error[エラー返却]
    Charge --> |成功| Save[DB保存]
    Charge --> |失敗| Retry{リトライ判定}
    Retry -- Yes --> Charge
    Retry -- No --> Error
    """`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('graph TD');
      expect(mermaidCode).toContain('Start[開始]');
      expect(mermaidCode).toContain('Validate{有効性確認}');
      expect(mermaidCode).toContain('Charge[課金実行]');
    }
  });

  it('should correctly calculate code range', () => {
    const code = `line1
line2
"""
mermaid
graph TD
    A --> B
"""
line7`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0]).toBeTruthy();
      expect(result.value[0].range).toBeTruthy();
      const range = result.value[0].range;
      expect(range.start).toBeTruthy();
      expect(range.end).toBeTruthy();
      expect(range.start as number).toBeGreaterThanOrEqual(2);
      expect((range.end as number)).toBeGreaterThan(range.start as number);
    }
  });
});

