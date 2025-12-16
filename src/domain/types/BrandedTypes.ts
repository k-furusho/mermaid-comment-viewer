declare const brand: unique symbol;

export type Brand<T, B> = T & { readonly [brand]: B };

export type MermaidCode = Brand<string, 'MermaidCode'>;
export type LineNumber = Brand<number, 'LineNumber'>;
export type Language =
  | 'typescript'
  | 'typescriptreact'
  | 'javascript'
  | 'javascriptreact'
  | 'python'
  | 'go'
  | 'rust';

import type { Result as ResultType } from './Result';
import { Result } from './Result';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const MermaidCode = {
  create(value: string): ResultType<MermaidCode, ValidationError> {
    const trimmed = value.trim();
    if (!trimmed) {
      return Result.err(new ValidationError('Empty mermaid code'));
    }
    return Result.ok(trimmed as MermaidCode);
  },
};

export const LineNumber = {
  create(value: number): ResultType<LineNumber, ValidationError> {
    if (value < 0) {
      return Result.err(new ValidationError('Line number must be non-negative'));
    }
    return Result.ok(value as LineNumber);
  },
};
