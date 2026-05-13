export interface DistanceService {
  id: string;
  name: string;
  line: string;
}

export interface DistanceLicense {
  id: string;
  services: DistanceService[];
}

export interface DistanceOperator {
  id: string;
  name: string;
  licenses: DistanceLicense[];
}

export interface DistancesDropdowns {
  operators: DistanceOperator[];
}

export interface AdminOrgMap {
  adminAreaId: number;
  adminName: string;
  operatorId: string;
  orgId: number;
  orgName: string;
}

export interface UserOrg {
  id: number;
  name: string;
}

export interface DistanceData extends Record<string, string | number | null | undefined> {
  operatorId: string;
  operatorName: string;
  nocLineAndServiceCode: string;
  lineName: string;
  serviceName: string;
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

export interface DistanceFiltersProps {
  isLoading: boolean;
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  adminAreaOptions: string[];
  selectedAdminAreas: string[];
  onAdminAreasChange: (selected: string[]) => void;
  orgOptions: string[];
  selectedOrgs: string[];
  onOrgsChange: (selected: string[]) => void;
  operatorOptions: string[];
  selectedOperators: string[];
  onOperatorsChange: (selected: string[]) => void;
  licenseOptions: string[];
  selectedLicenses: string[];
  onLicensesChange: (selected: string[]) => void;
  serviceOptions: string[];
  selectedServices: string[];
  onServicesChange: (selected: string[]) => void;
}