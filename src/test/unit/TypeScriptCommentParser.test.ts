import { describe, expect, it } from 'vitest';
import { Result } from '../../domain/types/Result';
import { TypeScriptCommentParser } from '../../infrastructure/parsers/TypeScriptCommentParser';

describe('TypeScriptCommentParser Test Suite', () => {
  const parser = new TypeScriptCommentParser();

  it('should parse basic mermaid comment', () => {
    const code = `/**
 * mermaid
 * graph TD
 *     A[Start] --> B[End]
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toBe('graph TD\n    A[Start] --> B[End]');
    }
  });

  it('should parse @mermaid annotation format', () => {
    const code = `/**
 * @mermaid
 * graph TD
 *     A[Start] --> B[End]
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toBe('graph TD\n    A[Start] --> B[End]');
    }
  });

  it('should parse @mermaid with multiple asterisks before annotation', () => {
    const code = `/**
 * 決済トランザクション管理クラス
 * * 外部決済プロバイダー（Stripe等）との整合性を保ちながら、
 * 注文のライフサイクルを管理します。
 * * ## ステート遷移図
 * * @mermaid
 * stateDiagram-v2
 *     [*] --> Created: 注文作成
 *     Created --> Locking: 在庫引当開始
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('stateDiagram-v2');
      expect(mermaidCode).toContain('[*] --> Created');
      expect(mermaidCode).toContain('Created --> Locking');
    }
  });

  it('should parse @mermaid with complex state diagram', () => {
    const code = `/**
 * 決済トランザクション管理クラス
 * * 外部決済プロバイダー（Stripe等）との整合性を保ちながら、
 * 注文のライフサイクルを管理します。
 * * ## ステート遷移図
 * * @mermaid
 * stateDiagram-v2
 *     [*] --> Created: 注文作成
 *     Created --> Locking: 在庫引当開始
 *     state fork_state <<fork>>
 *     Locking --> fork_state
 *     fork_state --> StockReserved: 引当成功
 *     fork_state --> Failed: 引当失敗
 *     StockReserved --> Authorized: クレジット与信確保
 *     Authorized --> Captured: 売上確定（発送時）
 *     Authorized --> Voided: ユーザーキャンセル/期限切れ
 *     Captured --> Refunded: 返金処理
 *     Failed --> [*]
 *     Voided --> [*]
 *     Refunded --> [*]
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('stateDiagram-v2');
      expect(mermaidCode).toContain('fork_state');
      expect(mermaidCode).toContain('StockReserved');
      expect(mermaidCode).toContain('Authorized');
      expect(mermaidCode).toContain('Captured');
      expect(mermaidCode).toContain('Refunded');
    }
  });

  it('should parse single line comment with mermaid', () => {
    const code = `/* mermaid\ngraph TD\nA-->B\n*/`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toBe('graph TD\nA-->B');
    }
  });

  it('should parse single line comment with @mermaid', () => {
    const code = `/* @mermaid\ngraph TD\nA-->B\n*/`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toBe('graph TD\nA-->B');
    }
  });

  it('should parse multiple mermaid blocks in same file', () => {
    const code = `/**
 * mermaid
 * graph TD
 *     A --> B
 */
function func1() {}

/**
 * @mermaid
 * sequenceDiagram
 *     A->>B: Message
 */
function func2() {}`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(2);
      expect(result.value[0].code).toContain('graph TD');
      expect(result.value[1].code).toContain('sequenceDiagram');
    }
  });

  it('should handle mermaid code with asterisks in content', () => {
    const code = `/**
 * mermaid
 * graph TD
 *     A[Start * Important] --> B[End]
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toContain('A[Start * Important]');
    }
  });

  it('should skip JSON-like strings to avoid false positives', () => {
    const code = '/* "mermaidInlineViewer": { "theme": "dark" } */';
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it('should return empty result for empty string', () => {
    const result = parser.parse('');
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it('should return empty result when no mermaid comment found', () => {
    const code = `/**
 * This is a regular comment
 * without mermaid code
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it('should correctly calculate code range', () => {
    const code = `line1
line2
/**
 * mermaid
 * graph TD
 *     A --> B
 */
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
      expect(range.end as number).toBeGreaterThan(range.start as number);
    }
  });

  it('should handle mermaid with special characters', () => {
    const code = `/**
 * mermaid
 * graph TD
 *     A["Node with \\"quotes\\""] --> B[Node with 'apostrophe']
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toContain('A[');
      expect(result.value[0].code).toContain('B[');
    }
  });
});
