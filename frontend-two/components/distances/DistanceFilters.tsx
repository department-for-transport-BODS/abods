import { MultiselectDropdown } from "@/components/shared/MultiselectDropdown";
import { DateRangeSelect } from "@/components/shared/DateRangeSelect";
import { DistanceFiltersProps } from "@/types/distances";

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
                        placeholderText={isLoading ? "Loading..." : "All areas"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        multiSelect={false}
                        label="Organisations"
                        options={orgOptions}
                        selected={selectedOrgs}
                        onChange={onOrgsChange}
                        placeholderText={isLoading ? "Loading..." : "All organisations"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Operators"
                        options={operatorOptions}
                        selected={selectedOperators}
                        onChange={onOperatorsChange}
                        placeholderText={isLoading ? "Loading..." : "All operators"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Licenses"
                        options={licenseOptions}
                        selected={selectedLicenses}
                        onChange={onLicensesChange}
                        placeholderText={isLoading ? "Loading..." : "All licenses"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Services"
                        options={serviceOptions}
                        selected={selectedServices}
                        onChange={onServicesChange}
                        placeholderText={isLoading ? "Loading..." : "All services"}
                    />
                </div>
            </div>
        </>
    )
};