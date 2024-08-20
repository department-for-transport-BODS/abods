import { defer, Observable, of, Subject } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

export type AsyncStatus = 'loading' | 'error' | 'complete' | null;

export function withStatus<T>(
  observableFactory: () => Observable<T[]>,
  status: Subject<AsyncStatus>
): Observable<T[] | null> {
  return defer(() => {
    status.next('loading');
    return observableFactory();
  }).pipe(
    catchError(() => {
      status.next('error');
      return of(null); // Swallow the error, allowing the outer pipeline to continue
    }),
    finalize(() => {
      status.next('complete');
    })
  );
}
