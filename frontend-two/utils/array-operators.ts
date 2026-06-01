export type NullishArray<T> = (T | null | undefined)[] | null | undefined;

export type Definitely<T> = {
  [P in keyof T]-?: T[P] extends (infer I)[]
    ? NonNullable<I>[]
    : NonNullable<T[P]>;
};

export function isNotNullOrUndefined<T>(
  value: T | undefined | null,
): value is T {
  return value !== null && value !== undefined;
}

export const nonNullishArray = <T>(array: NullishArray<T>): T[] =>
  (array ?? []).filter(isNotNullOrUndefined);
