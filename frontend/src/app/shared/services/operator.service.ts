import { Injectable } from "@angular/core";
import {
  LineType,
  OperatorLinesGQL,
  OperatorListGQL,
} from "../../../generated/graphql";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { flatMap as _flatMap, uniq as _uniq } from "lodash-es";
import { DateTime } from "luxon";

export interface Operator {
  name?: string | null;
  nocCode?: string | null;
  operatorId?: string | null;
  adminAreaIds: string[];
}

@Injectable({ providedIn: "root" })
export class OperatorService {
  constructor(
    private operatorListQuery: OperatorListGQL,
    private operatorLinesGQL: OperatorLinesGQL,
  ) {}

  fetchOperators(): Observable<Operator[]> {
    return this.operatorListQuery
      .fetch({})
      .pipe(map((result) => result.data.operators));
  }

  fetchOperator(nocCode: string): Observable<Operator | undefined> {
    return this.fetchOperators().pipe(
      map((operators) =>
        operators.find((operator) => operator.nocCode === nocCode),
      ),
    );
  }

  fetchLines(operatorId: string, inputDate: DateTime): Observable<LineType[]> {
    return this.operatorLinesGQL
      .fetch(
        {
          operatorIds: [operatorId],
          inputDate: inputDate.toISO(),
        },
        { fetchPolicy: "no-cache" },
      )
      .pipe(
        map((result) =>
          result.data.lines.sort((a, b) =>
            a.number.localeCompare(b.number, undefined, { numeric: true }),
          ),
        ),
      );
  }

  fetchAdminAreaIds(): Observable<string[]> {
    return this.fetchOperators().pipe(
      map((operators: Operator[]) =>
        _uniq(_flatMap(operators, "adminAreaIds")),
      ),
    );
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
            String(op.name).toLowerCase().includes(term.trim().toLowerCase()) ||
            String(op.nocCode)
              .toLowerCase()
              .includes(term.trim().toLowerCase()),
        ),
      ),
      catchError(() => of([])),
    );
  }
}
