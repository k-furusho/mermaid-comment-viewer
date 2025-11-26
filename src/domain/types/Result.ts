export type Result<T, E extends Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Result = {
  ok: <T>(value: T): Result<T, never> => ({ ok: true, value }),

  err: <E extends Error>(error: E): Result<never, E> => ({ ok: false, error }),

  isOk: <T, E extends Error>(result: Result<T, E>): result is { ok: true; value: T } => result.ok,

  isErr: <T, E extends Error>(result: Result<T, E>): result is { ok: false; error: E } =>
    !result.ok,

  map: <T, U, E extends Error>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
    result.ok ? Result.ok(fn(result.value)) : result,

  flatMap: <T, U, E extends Error>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>
  ): Result<U, E> => (result.ok ? fn(result.value) : result),

  unwrapOr: <T, E extends Error>(result: Result<T, E>, defaultValue: T): T =>
    result.ok ? result.value : defaultValue,
} as const;
