import { merge, Observable, OperatorFunction } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export function isNotNullOrUndefined<T>(value: T | undefined | null): value is T {
  return value !== null && value !== undefined;
}

export function ifNullOrUndefinedReturnEmptyString(value: string | undefined | null): string {
  if (value !== null && value !== undefined) {
    return value;
  } else {
    return '';
  }
}

/**
 * Filter out null and undefined values from the source in a type-safe way. Equivalent to `filter((value) => !!value)`
 * but using a type guard to allow Typescript to infer that subsequent emissions have a value.
 * @deprecated use assertNonNullish() instead
 */
export function nonNullOrUndefined<T>(): OperatorFunction<T | null | undefined, T> {
  return (source$) => source$.pipe(filter(isNotNullOrUndefined));
}

export function assertNonNullish<T>(): OperatorFunction<T | null | undefined, T> {
  return (source$) =>
    source$.pipe(
      map((value) => {
        if (!isNotNullOrUndefined(value)) {
          throw new Error('Expected non-nullish value');
        }
        return value;
      })
    );
}

type ObservableInputTuple<T> = {
  [K in keyof T]: Observable<T[K]>;
};

/**
 * Behaves like merge() but emits values as a tuple like combineAll().
 *   combine(a$, b$).subscribe(([a, b]) => console.log(a, b));
 *   a            ---A|
 *   b            --------B----B|
 *   combine(a,b) ---[A,]-[,B]-[,B]|
 * @param sources
 */
export function combine<A extends readonly unknown[]>(sources: readonly [...ObservableInputTuple<A>]): Observable<A> {
  return merge(
    ...sources.map((source, index) =>
      source.pipe(
        map((value) => {
          const values = new Array(sources.length);
          values[index] = value;
          return (values as unknown) as A;
        })
      )
    )
  );
}
