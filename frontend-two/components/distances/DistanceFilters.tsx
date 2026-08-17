import { clsx } from "clsx";
import styles from "./distance-filters.module.scss";
import { MultiselectCheckbox } from "@/components/shared/MultiselectCheckbox/MultiselectCheckbox";
import { DateRangeSelect } from "@/components/shared/DateRangeSelect/DateRangeSelect";

interface DistanceFiltersProps {
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

export const DistanceFilters = ({
  isLoading,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  adminAreaOptions,
  selectedAdminAreas,
  onAdminAreasChange,
  orgOptions,
  selectedOrgs,
  onOrgsChange,
  operatorOptions,
  selectedOperators,
  onOperatorsChange,
  licenseOptions,
  selectedLicenses,
  onLicensesChange,
  serviceOptions,
  selectedServices,
  onServicesChange,
}: DistanceFiltersProps) => {
  const toOptions = (values: string[]) =>
    values.map((value) => ({ label: value, value }));

  return (
    <>
      <div className={styles["distance-grid__filters"]}>
        <div className={styles["distance-grid__filter"]}>
          <DateRangeSelect
            label="Date Range"
            fullWidth
            value={{ from: fromDate, to: toDate }}
            onChange={({ from, to }) => {
              onFromDateChange(from);
              onToDateChange(to);
            }}
          />
        </div>
        <div className={styles["distance-grid__filter"]}>
          <MultiselectCheckbox
            id="distance-admin-area"
            label="Admin Area"
            showAllLabel="Admin area"
            options={toOptions(adminAreaOptions)}
            selectedValues={selectedAdminAreas}
            onChange={onAdminAreasChange}
            placeholder={isLoading ? "Loading..." : "All areas"}
          />
        </div>
        <div className={styles["distance-grid__filter"]}>
          <MultiselectCheckbox
            id="distance-organisations"
            label="Organisations"
            options={toOptions(orgOptions)}
            selectedValues={selectedOrgs}
            onChange={(selected) => {
              onOrgsChange(
                selected.length > 1
                  ? [selected[selected.length - 1]]
                  : selected,
              );
            }}
            showAll={false}
            placeholder={isLoading ? "Loading..." : "All organisations"}
            allowMultiselect={false}
          />
        </div>
      </div>
      <div
        className={clsx(styles["distance-grid__filters"], styles["distance-grid__filtersLast"])}
      >
        <div className={styles["distance-grid__filter"]}>
          <MultiselectCheckbox
            id="distance-operators"
            label="Operators"
            showAllLabel="All Operators"
            options={toOptions(operatorOptions)}
            selectedValues={selectedOperators}
            onChange={onOperatorsChange}
            placeholder={isLoading ? "Loading..." : "All operators"}
          />
        </div>
        <div className={styles["distance-grid__filter"]}>
          <MultiselectCheckbox
            id="distance-licenses"
            label="Licenses"
            showAllLabel="All Licenses"
            options={toOptions(licenseOptions)}
            selectedValues={selectedLicenses}
            onChange={onLicensesChange}
            placeholder={isLoading ? "Loading..." : "All licenses"}
          />
        </div>
        <div className={styles["distance-grid__filter"]}>
          <MultiselectCheckbox
            id="distance-services"
            label="Services"
            showAllLabel="All Services"
            options={toOptions(serviceOptions)}
            selectedValues={selectedServices}
            onChange={onServicesChange}
            placeholder={isLoading ? "Loading..." : "All services"}
          />
        </div>
      </div>
    </>
  );
};
