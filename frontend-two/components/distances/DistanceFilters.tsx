import { MultiselectDropdown } from "@/components/shared/MultiselectDropdown";
import { DateRangeSelect } from "@/components/shared/DateRangeSelect";
import { DistanceFiltersProps } from "@/types/distances";
// TODO:NOW Figure out what the ORGANISATIONS filter is meant to do

export const DistanceFilters = ({
    isLoading,
    fromDate, toDate, onFromDateChange, onToDateChange,
    adminAreaOptions, selectedAdminAreas, onAdminAreasChange,
    orgOptions, selectedOrgs, onOrgsChange,
    operatorOptions, selectedOperators, onOperatorsChange,
    licenseOptions, selectedLicenses, onLicensesChange,
    serviceOptions, selectedServices, onServicesChange,
}: DistanceFiltersProps) => {
    return (
        <>
            <div className="distance-grid__filters">
                <div className="distance-grid__filter">
                    <DateRangeSelect
                        value={{ from: fromDate, to: toDate }}
                        onChange={({from, to}) => {
                            onFromDateChange(from);
                            onToDateChange(to);
                        }}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Admin Area"
                        options={adminAreaOptions}
                        selected={selectedAdminAreas}
                        onChange={onAdminAreasChange}
                        placeholder={isLoading ? "Loading..." : "All areas"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Organisations"
                        options={orgOptions}
                        selected={selectedOrgs}
                        onChange={onOrgsChange}
                        placeholder={isLoading ? "Loading..." : "All organisations"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Operators"
                        options={operatorOptions}
                        selected={selectedOperators}
                        onChange={onOperatorsChange}
                        placeholder={isLoading ? "Loading..." : "All operators"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Licenses"
                        options={licenseOptions}
                        selected={selectedLicenses}
                        onChange={onLicensesChange}
                        placeholder={isLoading ? "Loading..." : "All licenses"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Services"
                        options={serviceOptions}
                        selected={selectedServices}
                        onChange={onServicesChange}
                        placeholder={isLoading ? "Loading..." : "All services"}
                    />
                </div>
            </div>
        </>
    )
};