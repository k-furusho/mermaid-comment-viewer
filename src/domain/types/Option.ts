export type Option<T> = { readonly some: true; readonly value: T } | { readonly some: false };

export const Option = {
  some: <T>(value: T): Option<T> => ({ some: true, value }),

  none: <T = never>(): Option<T> => ({ some: false }),

  isSome: <T>(option: Option<T>): option is { some: true; value: T } => option.some,

  isNone: <T>(option: Option<T>): option is { some: false } => !option.some,

  map: <T, U>(option: Option<T>, fn: (value: T) => U): Option<U> =>
    option.some ? Option.some(fn(option.value)) : Option.none(),

  unwrapOr: <T>(option: Option<T>, defaultValue: T): T =>
    option.some ? option.value : defaultValue,
} as const;
