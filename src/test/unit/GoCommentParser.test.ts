import { describe, it, expect } from 'vitest';
import { Result } from '../../domain/types/Result';
import { GoCommentParser } from '../../infrastructure/parsers/GoCommentParser';

describe('GoCommentParser Test Suite', () => {
  const parser = new GoCommentParser();

  it('should parse basic mermaid comment', () => {
    const code = `/*
mermaid
graph LR
    A[Client] --> B[API]
    B --> C[Database]
*/`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toContain('graph LR');
      expect(result.value[0].code).toContain('A[Client]');
    }
  });

  it('should parse @mermaid annotation format', () => {
    const code = `/*
@mermaid
graph LR
    A[Client] --> B[API]
    B --> C[Database]
*/`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].code).toContain('graph LR');
    }
  });

  it('should parse @mermaid with asterisks in comment lines', () => {
    const code = `/*
 * @mermaid
 * graph LR
 *     A[Client] --> B[API]
 *     B --> C[Database]
 */`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('graph LR');
      expect(mermaidCode).toContain('A[Client]');
      // Asterisks should be removed
      expect(mermaidCode).not.toContain('*');
    }
  });

  it('should parse complex flowchart diagram', () => {
    const code = `/*
mermaid
flowchart TD
    Start([Start]) --> Input[Get User Input]
    Input --> Validate{Valid?}
    Validate -->|Yes| Process[Process Data]
    Validate -->|No| Error[Show Error]
    Process --> Save[Save to Database]
    Save --> End([End])
    Error --> Input
*/`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('flowchart TD');
      expect(mermaidCode.includes('Start([Start]).toBe(true)'));
      expect(mermaidCode).toContain('Validate{Valid?}');
    }
  });

  it('should parse sequence diagram', () => {
    const code = `/*
mermaid
sequenceDiagram
    participant C as Client
    participant L as LoadBalancer
    participant S1 as Server1
    participant S2 as Server2
    participant DB as Database

    C->>L: Request
    L->>S1: Forward
    S1->>DB: Query
    DB-->>S1: Result
    S1-->>L: Response
    L-->>C: Response
*/`;
    const result = parser.parse(code);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.length).toBe(1);
      const mermaidCode = result.value[0].code;
      expect(mermaidCode).toContain('sequenceDiagram');
      expect(mermaidCode).toContain('participant C as Client');
      expect(mermaidCode).toContain('C->>L: Request');
    }
  });

  it('should parse multiple mermaid blocks in same file', () => {
    const code = `/*
mermaid
graph TD
    A --> B
*/
func func1() {}

/*
@mermaid
sequenceDiagram
    A->>B: Message
*/
func func2() {}`;
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

