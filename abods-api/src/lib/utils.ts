import { Maybe } from '../types.js';

export const isDefined = <T>(value: Maybe<T>): value is T => {
  return value !== null && value !== undefined;
}
