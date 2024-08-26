import { Injectable } from '@angular/core';
import { OperatorLinesGQL, OperatorListGQL } from '../../../generated/graphql';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { map as _map, flatMap as _flatMap, uniq as _uniq } from 'lodash-es';
import { nonNullishArray } from '../array-operators';

export interface Operator {
  name?: string | null;
  nocCode?: string | null;
  operatorId?: string | null;
  adminAreaIds: string[];
}

// FIXME Potentially confusing clash of nomenclature. The Angular app generally refers
//  to 'services' but the backend refers to them as 'lines'. Maybe following that
//  convention would be preferable?
export interface Line {
  id: string;
  name: string;
  number: string;
}

@Injectable({ providedIn: 'root' })
export class OperatorService {
  constructor(private operatorListQuery: OperatorListGQL, private operatorLinesGQL: OperatorLinesGQL) {}

  fetchOperators(): Observable<Operator[]> {
    return this.operatorListQuery.fetch().pipe(
      map((result) =>
        nonNullishArray(result?.data?.operators.items).map(({ adminAreas, ...operator }) => ({
          ...operator,
          adminAreaIds: _map(nonNullishArray(adminAreas), 'adminAreaId'),
        }))
      )
    );
  }

  fetchOperator(nocCode: string): Observable<Operator | undefined> {
    return this.fetchOperators().pipe(map((operators) => operators.find((operator) => operator.nocCode === nocCode)));
  }

  fetchLines(operatorId: string): Observable<Line[]> {
    return this.operatorLinesGQL.fetch({ operatorId }, { fetchPolicy: 'no-cache' }).pipe(
      map((result) => nonNullishArray(result.data.operator?.transitModel.lines.items)),
      map((lines) => lines.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })))
    );
  }

  fetchAdminAreaIds(): Observable<string[]> {
    return this.fetchOperators().pipe(map((operators: Operator[]) => _uniq(_flatMap(operators, 'adminAreaIds'))));
  }

  /**
   * Search term can contain operator name or noc
   * Empty term will return all operators
   * @param term
   * @returns
   */
  searchOperators(term: string): Observable<Operator[]> {
    return this.fetchOperators().pipe(
      map((operators) =>
        operators.filter(
          (op) =>
            String(op.name).toLowerCase().indexOf(term.trim().toLowerCase()) > -1 ||
            String(op.nocCode).toLowerCase().indexOf(term.trim().toLowerCase()) > -1
        )
      ),
      catchError(() => of([]))
    );
  }
}
