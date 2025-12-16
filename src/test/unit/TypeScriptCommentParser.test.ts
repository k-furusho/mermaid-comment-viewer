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
 * Payment Transaction Management
 * * Integrates with external payment providers (Stripe, etc.)
 * and manages order lifecycle.
 * * ## State Transition Diagram
 * * @mermaid
 * stateDiagram-v2
 *     [*] --> Created: Order Created
 *     Created --> Locking: Stock Allocation
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
 * Payment Transaction Management
 * * Integrates with external payment providers (Stripe, etc.)
 * * ## State Transition Diagram
 * * @mermaid
 * stateDiagram-v2
 *     [*] --> Created: Order Created
 *     Created --> Locking: Stock Allocation
 *     state fork_state <<fork>>
 *     Locking --> fork_state
 *     fork_state --> StockReserved: Allocation Success
 *     fork_state --> Failed: Allocation Failed
 *     StockReserved --> Authorized: Credit Auth
 *     Authorized --> Captured: Sales Confirmed
 *     Authorized --> Voided: User Cancel/Expired
 *     Captured --> Refunded: Refund
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

  it('should parse Mermaid: keyword format', () => {
    const code = `/**
 * Bulk User Creation Script
 *
 * Creates multiple user accounts from a CSV file.
 *
 * Mermaid:
 * graph TD
 *   Start[Start Script] --> CheckToken{JWT_TOKEN<br/>Check Env}
 *   CheckToken -- No --> ErrorToken[Error: Token Not Set]
 *   CheckToken -- Yes --> ReadCSV[Read CSV File]
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('graph TD');
      expect(mermaidCode).toContain('Start[Start Script]');
      expect(mermaidCode).toContain('CheckToken{JWT_TOKEN');
    }
  });

  it('should parse Mermaid: keyword format and exclude following documentation', () => {
    const code = `/**
 * Bulk User Creation Script
 *
 * Creates multiple user accounts from a CSV file.
 *
 * Mermaid:
 * graph TD
 *   Start[Start Script] --> CheckToken{JWT_TOKEN<br/>Check Env}
 *   CheckToken -- No --> ErrorToken[Error: Token Not Set]
 *   CheckToken -- Yes --> ReadCSV[Read CSV File]
 *
 * Security Considerations:
 * - Passwords should be plain text in CSV, hashed by API with PBKDF2-SHA256
 * - CSV file should be securely deleted or encrypted after execution
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('graph TD');
      expect(mermaidCode).toContain('Start[Start Script]');
      expect(mermaidCode).toContain('CheckToken{JWT_TOKEN');
      // Should not contain the security considerations text
      expect(mermaidCode).not.toContain('Security Considerations');
      expect(mermaidCode).not.toContain('Passwords should be plain text');
    }
  });

  it('should not cross comment boundaries - separate JSDoc before @mermaid block', () => {
    // This test ensures the regex doesn't match from one comment block to @mermaid in another
    const code = `
interface Props {
  /** システムエラー用 */
  errors: string[];
  /** バリデーションエラー用 */
  lineErrors?: string[];
}

/**
 * DryRunError - エラー表示モジュール
 *
 * @mermaid
 * graph TD
 *   A[Start] --> B[End]
 */
function Component() {}`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      // Should only find 1 mermaid block, not match from /** システムエラー用 */
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('graph TD');
      expect(mermaidCode).toContain('A[Start]');
      // Should NOT contain content from other comments
      expect(mermaidCode).not.toContain('システムエラー');
      expect(mermaidCode).not.toContain('バリデーションエラー');
      // Verify range starts at the correct line (around line 10, not line 3)
      expect(result.value[0].range.start).toBeGreaterThan(5);
    }
  });

  it('should handle multiple small JSDoc comments before @mermaid comment', () => {
    const code = `
/** Comment 1 */
const a = 1;

/** Comment 2 */
const b = 2;

/** Comment 3 */
const c = 3;

/**
 * @mermaid
 * sequenceDiagram
 *   A->>B: Hello
 */
function test() {}`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toContain('sequenceDiagram');
      expect(result.value[0].code).not.toContain('Comment 1');
      expect(result.value[0].code).not.toContain('Comment 2');
      expect(result.value[0].code).not.toContain('Comment 3');
    }
  });

  it('should correctly parse multiple mermaid blocks with interleaved regular comments', () => {
    const code = `
/** 通常コメント1 */
interface Config {}

/**
 * @mermaid
 * graph TD
 *   A[First] --> B[Diagram]
 */
function first() {}

/** 通常コメント2: 説明 */
const value = 1;

/** 通常コメント3 */
type MyType = string;

/**
 * Second diagram
 * @mermaid
 * sequenceDiagram
 *   User->>API: Request
 *   API-->>User: Response
 */
function second() {}

/** 通常コメント4 */
const end = true;`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      // Should find exactly 2 mermaid blocks
      expect(result.value.length).toBe(2);

      // First mermaid block
      expect(result.value[0].code).toContain('graph TD');
      expect(result.value[0].code).toContain('A[First]');
      expect(result.value[0].code).not.toContain('通常コメント');

      // Second mermaid block
      expect(result.value[1].code).toContain('sequenceDiagram');
      expect(result.value[1].code).toContain('User->>API');
      expect(result.value[1].code).not.toContain('通常コメント');

      // Verify ranges are in correct order
      expect(result.value[0].range.start).toBeLessThan(result.value[1].range.start as number);
    }
  });
});
