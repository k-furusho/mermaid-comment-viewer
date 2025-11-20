import type { CodeRange } from '../entities/CodeRange';
import type { MermaidCode } from '../types/BrandedTypes';
import type { Result } from '../types/Result';

export interface ICommentParser {
  parse(text: string): Result<Array<{ code: MermaidCode; range: CodeRange }>, Error>;
}
