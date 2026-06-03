export interface DistanceService {
  id: string;
  name: string;
  line: string;
}

export interface DistanceLicense {
  id: string;
  services: DistanceService[] | null;
}

export interface DistanceOperator {
  id: string;
  name: string;
  licenses: DistanceLicense[] | null;
}

export interface DistancesDropdowns {
  operators: DistanceOperator[] | null;
}

export interface AdminOrgMap {
  adminAreaId: number;
  adminName: string | null;
  operatorId: string;
  orgId: number;
  orgName: string | null;
}

export interface UserOrg {
  id: number;
  name: string;
}

export interface DistanceData extends Record<
  string,
  string | number | null | undefined
> {
  operatorId: string;
  operatorName: string;
  nocLineAndServiceCode: string;
  lineName: string;
  serviceName: string | null;
  distance: number | null;
  avlDistance: number | null;
}

export interface DistancesFilterInput {
  orgId?: string;
  operatorIds?: string[];
  fromTimestamp?: string;
  toTimestamp?: string;
  nocLineAndServiceCodes?: string[];
  licenseIds?: string[];
  adminAreaIds?: string[];
}
