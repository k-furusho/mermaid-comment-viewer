import type { ICommentParser } from '../../domain/interfaces/ICommentParser';
import type { Language } from '../../domain/types/BrandedTypes';
import { GoCommentParser } from '../parsers/GoCommentParser';
import { PythonCommentParser } from '../parsers/PythonCommentParser';
import { RustCommentParser } from '../parsers/RustCommentParser';
import { TypeScriptCommentParser } from '../parsers/TypeScriptCommentParser';

/**
 * Factory for creating language-specific comment parsers.
 * Provides a centralized registry of parsers to avoid duplication.
 */
export class ParserFactory {
  private static parsers: Map<Language, ICommentParser> | undefined;

  /**
   * Get the singleton parser registry.
   * Parsers are instantiated once and reused across the extension.
   */
  static getParsers(): Map<Language, ICommentParser> {
    if (!ParserFactory.parsers) {
      ParserFactory.parsers = new Map();
      ParserFactory.parsers.set('typescript', new TypeScriptCommentParser());
      ParserFactory.parsers.set('javascript', new TypeScriptCommentParser());
      ParserFactory.parsers.set('go', new GoCommentParser());
      ParserFactory.parsers.set('rust', new RustCommentParser());
      ParserFactory.parsers.set('python', new PythonCommentParser());
    }
    return ParserFactory.parsers;
  }

  /**
   * Get a parser for the specified language.
   * @param language - The programming language identifier
   * @returns The parser instance, or undefined if not supported
   */
  static getParser(language: Language): ICommentParser | undefined {
    return ParserFactory.getParsers().get(language);
  }
}
