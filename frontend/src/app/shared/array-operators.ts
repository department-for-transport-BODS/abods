import { isNotNullOrUndefined } from './rxjs-operators';
import { slice, tail, zip } from 'lodash-es';

export type Definitely<T> = {
  [P in keyof T]-?: T[P] extends Array<infer I> ? NonNullable<I>[] : NonNullable<T[P]>;
};

export type NullishArray<T> = (T | null | undefined)[] | null | undefined;

export const nonNullishArray = <T>(array: NullishArray<T>): T[] => (array ?? []).filter(isNotNullOrUndefined);

export const pairwise = <T>(arr: T[]): [T, T][] => zip(slice(arr, 0, -1), tail(arr)) as [T, T][];
