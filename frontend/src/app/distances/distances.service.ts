import { Injectable } from "@angular/core";
import {
  DistancesFilterInput,
  DistancesListGQL,
  OrgOperatorListGQL,
  UserOrganisationsGQL,
} from "../../generated/graphql";
import { map } from "rxjs";

@Injectable({ providedIn: "root" })
export class DistancesService {
  constructor(
    private orgOperatorList: OrgOperatorListGQL,
    private userOrgs: UserOrganisationsGQL,
    private distances: DistancesListGQL,
  ) {}
  fetchOperatorsUsingOrg(orgId: number) {
    return this.orgOperatorList
      .fetch({
        orgId: orgId,
      })
      .pipe(map((result) => result.data.operators));
  }

  fetchUserOrgs() {
    return this.userOrgs.fetch({}).pipe(map((result) => result.data.userOrgs));
  }

  fetchDistances(filterBy: DistancesFilterInput) {
    return this.distances
      .fetch({ filterBy })
      .pipe(map((result) => result.data.distances));
  }
}
