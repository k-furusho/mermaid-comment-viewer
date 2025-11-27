import { describe, it, expect } from 'vitest';
import { Result } from '../../domain/types/Result';
import { RustCommentParser } from '../../infrastructure/parsers/RustCommentParser';

describe('RustCommentParser Test Suite', () => {
  const parser = new RustCommentParser();

  it('should parse basic mermaid block comment', () => {
    const code = `/*
mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing
    Processing --> Complete
    Complete --> [*]
*/`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toContain('stateDiagram-v2');
      expect(result.value[0].code).toContain('[*] --> Idle');
    }
  });

  it('should parse @mermaid annotation format in block comment', () => {
    const code = `/*
@mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing
*/`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toContain('stateDiagram-v2');
    }
  });

  it('should parse @mermaid with asterisks in comment lines', () => {
    const code = `/*
 * @mermaid
 * stateDiagram-v2
 *     [*] --> Idle
 *     Idle --> Processing
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('stateDiagram-v2');
      // Asterisks should be removed
      expect(mermaidCode).not.toContain('* @mermaid');
    }
  });

  it('should parse doc comment with //! style', () => {
    const code = `//! mermaid
//! graph TD
//!     A[Parse Input] --> B{Valid?}
//!     B -->|Yes| C[Process]
//!     B -->|No| D[Return Error]`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('graph TD');
      expect(mermaidCode).toContain('A[Parse Input]');
      // //! prefix should be removed
      expect(mermaidCode).not.toContain('//!');
    }
  });

  it('should parse @mermaid in doc comment with //! style', () => {
    const code = `//! @mermaid
//! graph TD
//!     A --> B
//!     B --> C`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('graph TD');
      expect(mermaidCode).not.toContain('//!');
    }
  });

  it('should parse complex state diagram', () => {
    const code = `/*
mermaid
graph TD
    A[Parse Input] --> B{Valid?}
    B -->|Yes| C[Process]
    B -->|No| D[Return Error]
    C --> E[Transform]
    E --> F[Output]
    D --> G[Log Error]
    G --> H[End]
    F --> H
*/`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('graph TD');
      expect(mermaidCode).toContain('A[Parse Input]');
      expect(mermaidCode).toContain('B{Valid?}');
    }
  });

  it('should parse sequence diagram', () => {
    const code = `/*
mermaid
sequenceDiagram
    participant U as User
    participant S as Service
    participant R as Repository
    participant D as Database

    U->>S: Request
    S->>R: Get Data
    R->>D: Query
    D-->>R: Result
    R-->>S: Data
    S-->>U: Response
*/`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('sequenceDiagram');
      expect(mermaidCode).toContain('participant U as User');
      expect(mermaidCode).toContain('U->>S: Request');
    }
  });

  it('should parse multiple mermaid blocks with different comment styles', () => {
    const code = `/*
mermaid
graph TD
    A --> B
*/
fn func1() {}

//! @mermaid
//! sequenceDiagram
//!     A->>B: Message
fn func2() {}`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(2);
      expect(result.value[0].code).toContain('graph TD');
      expect(result.value[1].code).toContain('sequenceDiagram');
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
    const code = `/*
This is a regular comment
without mermaid code
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
/*
mermaid
graph TD
    A --> B
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
      expect((range.end as number)).toBeGreaterThan(range.start as number);
    }
  });
});

