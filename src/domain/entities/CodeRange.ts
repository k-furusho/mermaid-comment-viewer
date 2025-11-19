import type { LineNumber } from '../types/BrandedTypes';
import type { Result } from '../types/Result';
import { Result as R } from '../types/Result';

class RangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RangeError';
  }
}

export class CodeRange {
  private constructor(
    public readonly start: LineNumber,
    public readonly end: LineNumber
  ) {}

  static create(
    start: LineNumber,
    end: LineNumber
  ): Result<CodeRange, RangeError> {
    if (end < start) {
      return R.err(new RangeError('End must be >= start'));
    }
    return R.ok(new CodeRange(start, end));
  }

  public contains(line: LineNumber): boolean {
    return line >= this.start && line <= this.end;
  }

  public length(): number {
    return this.end - this.start + 1;
  }
}