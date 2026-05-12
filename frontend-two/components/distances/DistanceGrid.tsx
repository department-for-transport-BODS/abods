import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { DistanceTable } from "./DistanceTable";
import { MultiselectDropdown } from "@/components/shared/MultiselectDropdown";
import { useConfig } from "@/contexts/ConfigContext";
import { distanceService } from "@/services/distances/distance.services";
import { AdminOrgMap, Distance, DistanceOperator, UserOrg } from "@/types/distances";

const Select = dynamic(
    () => import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.Select),
    { ssr: false },
);

const Button = dynamic(
  () => import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.Button),
  { ssr: false },
);

export const DistanceGrid = () => {
    const { config } = useConfig();

    const [adminOrgMap, setAdminOrgMap] = useState<AdminOrgMap[]>([]);
    const [operators, setOperators] = useState<DistanceOperator[]>([]);
    const [userOrgs, setUserOrgs] = useState<UserOrg[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filtered by dropdown values
    const [selectedAdminAreas, setSelectedAdminAreas] = useState<string[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string[]>([]);
    const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
    const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    const [tableData, setTableData] = useState<Distance[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!config?.apiUrl) return;
        const load = async () => {
            setIsLoading(true);
            const [dropdowns, orgMap, orgs] = await Promise.all([
                distanceService.fetchDropdowns(config.apiUrl),
                distanceService.fetchAdminOrgList(config.apiUrl),
                distanceService.fetchUserOrgs(config.apiUrl),
            ]);
            setOperators(dropdowns.operators ?? []);
            setAdminOrgMap(orgMap);
            setUserOrgs(orgs);
            setIsLoading(false);
        };
        load();
    }, [config?.apiUrl]);

    // Options for dropdowns and filtering
    const adminAreaOptions = useMemo(() => {
        const seen = new Set<number>();
        return adminOrgMap
            .filter((r) => { if (seen.has(r.adminAreaId)) return false; seen.add(r.adminAreaId); return true; })
            .map((r) => r.adminName)
            .sort();
    }, [adminOrgMap]);

    const orgOptions = useMemo(() => {
        const seen = new Set<number>();
        return adminOrgMap
            .filter((r) => { if (seen.has(r.orgId)) return false; seen.add(r.orgId); return true; })
            .map((r) => r.orgName)
            .sort();
    }, [adminOrgMap]);

    const operatorOptions = useMemo(() =>
        operators.map((o) => o.name).sort(),
    [operators]);

    const licenseOptions = useMemo(() => {
        const relevant = selectedOperators.length > 0
            ? operators.filter((o) => selectedOperators.includes(o.name))
            : operators;
        return relevant.flatMap((o) => o.licenses.map((l) => l.id)).sort();
    }, [operators, selectedOperators]);

    const serviceOptions = useMemo(() => {
        const relevant = selectedOperators.length > 0
            ? operators.filter((o) => selectedOperators.includes(o.name))
            : operators;
        const relevantLicenses = selectedLicenses.length > 0
            ? relevant.flatMap((o) => o.licenses.filter((l) => selectedLicenses.includes(l.id)))
            : relevant.flatMap((o) => o.licenses);
        return relevantLicenses.flatMap((l) => l.services.map((s) => `${s.line}-${s.name}`)).sort();
    }, [operators, selectedOperators, selectedLicenses]);

    const handleGenerate = async () => {
        if (!config?.apiUrl) return;
        setIsGenerating(true);

        const operatorIds = operators
            .filter((o) => selectedOperators.includes(o.name))
            .map((o) => o.id);

        const nocLineAndServiceCodes = selectedServices.length > 0
            ? operators.flatMap((o) => o.licenses).flatMap((l) => l.services)
                .filter((s) => selectedServices.includes(`${s.line}-${s.name}`))
                .map((s) => s.id)
            : [];

        const adminAreaIds = adminOrgMap
            .filter((r) => selectedAdminAreas.includes(r.adminName))
            .map((r) => r.adminAreaId.toString());

        const orgId = userOrgs.find((o) => selectedOrgId.includes(o.name))?.id?.toString();

        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 7);

        const data = await distanceService.fetchDistances(config.apiUrl, {
            orgId,
            operatorIds,
            licenseIds: selectedLicenses,
            nocLineAndServiceCodes,
            adminAreaIds,
            fromTimestamp: from.toISOString(),
            toTimestamp: to.toISOString(),
        });

        setTableData(data);
        setIsGenerating(false);
    };

    return (
        <div>
            <div className="distance-grid__filters">
                <div className="distance-grid__filter">
                    <Select
                        name="admin-area"
                        label={{ children: "Date" }}
                        className="govuk-!-width-full"
                        items={[
                            { value: "all", text: "All", selected: true },
                            { value: "admin-area1", text: "Admin Area 1" },
                            { value: "admin-area2", text: "Admin Area 2" },
                        ]}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Admin Area"
                        options={adminAreaOptions}
                        selected={selectedAdminAreas}
                        onChange={setSelectedAdminAreas}
                        placeholder={isLoading ? "Loading..." : "All areas"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Organisations"
                        options={orgOptions}
                        selected={selectedOrgId}
                        onChange={setSelectedOrgId}
                        placeholder={isLoading ? "Loading..." : "All organisations"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Operators"
                        options={operatorOptions}
                        selected={selectedOperators}
                        onChange={setSelectedOperators}
                        placeholder={isLoading ? "Loading..." : "All operators"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Licenses"
                        options={licenseOptions}
                        selected={selectedLicenses}
                        onChange={setSelectedLicenses}
                        placeholder={isLoading ? "Loading..." : "All licenses"}
                    />
                </div>
                <div className="distance-grid__filter">
                    <MultiselectDropdown
                        label="Services"
                        options={serviceOptions}
                        selected={selectedServices}
                        onChange={setSelectedServices}
                        placeholder={isLoading ? "Loading..." : "All services"}
                    />
                </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || isLoading}>
                {isGenerating ? "Loading..." : "Generate"}
            </Button>
            <DistanceTable data={tableData} />
        </div>
    );
};