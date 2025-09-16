import { Injectable } from "@angular/core";
import {
  AdminOrgListGQL,
  DistancesDropdownInputGQL,
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
    private distances: DistancesListGQL,
    private adminOrgList: AdminOrgListGQL,
    private distancesDropdowns: DistancesDropdownInputGQL,
    private userOrgs: UserOrganisationsGQL,
  ) {}
  fetchOperatorsUsingOrg(orgId: number) {
    return this.orgOperatorList
      .fetch({
        orgId: orgId,
      })
      .pipe(map((result) => result.data.operators));
  }

  fetchDistances(filterBy: DistancesFilterInput) {
    return this.distances
      .fetch({ filterBy })
      .pipe(map((result) => result.data.distances));
  }

  fetchAdminOrgList() {
    return this.adminOrgList
      .fetch({})
      .pipe(map((result) => result.data.adminOrgMap));
  }

  fetchDistancesDropdows() {
    return this.distancesDropdowns
      .fetch({})
      .pipe(map((result) => result.data.distancesDropdowns));
  }

  fetchUserOrgs() {
    return this.userOrgs.fetch({}).pipe(map((result) => result.data.userOrgs));
  }
}
