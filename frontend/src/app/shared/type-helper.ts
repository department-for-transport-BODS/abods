import { Maybe } from '../../generated/graphql';
import { isNotNullOrUndefined } from './rxjs-operators';

export const maybeToTypeOrUndefined = <T>(value: Maybe<T>): T | undefined =>
  isNotNullOrUndefined(value) ? value : undefined;
