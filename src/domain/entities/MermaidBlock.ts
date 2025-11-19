import type { MermaidCode, Language } from '../types/BrandedTypes';
import type { CodeRange } from './CodeRange';
import type { Result } from '../types/Result';
import { Result as R } from '../types/Result';
import { randomUUID } from 'crypto';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class MermaidBlock {
  private constructor(
    public readonly id: string,
    public readonly code: MermaidCode,
    public readonly range: CodeRange,
    public readonly language: Language
  ) {}

  static create(
    code: MermaidCode,
    range: CodeRange,
    language: Language
  ): Result<MermaidBlock, ValidationError> {
    const id = randomUUID();
    return R.ok(new MermaidBlock(id, code, range, language));
  }

  public normalize(): string {
    return (this.code as string).trim();
  }
}