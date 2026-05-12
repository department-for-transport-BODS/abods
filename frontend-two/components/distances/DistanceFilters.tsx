import { MultiselectDropdown } from "@/components/shared/MultiselectDropdown";
import { DateSelect } from "@/components/shared/DateSelect";
import { DistanceFiltersProps } from "@/types/distances";
// TODO:NOW Figure out what the ORGANISATIONS filter is meant to do

export const DistanceFilters = ({
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
                    <DateSelect />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Admin Area"
                        options={adminAreaOptions}
                        selected={selectedAdminAreas}
                        onChange={onAdminAreasChange}
                        placeholder="All areas"
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Organisations"
                        options={orgOptions}
                        selected={selectedOrgs}
                        onChange={onOrgsChange}
                        placeholder="All organisations"
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Operators"
                        options={operatorOptions}
                        selected={selectedOperators}
                        onChange={onOperatorsChange}
                        placeholder="All operators"
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Licenses"
                        options={licenseOptions}
                        selected={selectedLicenses}
                        onChange={onLicensesChange}
                        placeholder="All licenses"
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Services"
                        options={serviceOptions}
                        selected={selectedServices}
                        onChange={onServicesChange}
                        placeholder="All services"
                    />
                </div>
            </div>
        </>
    )
};