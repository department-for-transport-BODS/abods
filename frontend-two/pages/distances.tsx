import { useConfig } from "@/contexts/ConfigContext";
import { BaseLayout } from "../components/layout/BaseLayout";
import { DistanceFilters} from "../components/distances/DistanceFilters";
import { DistanceTable } from "@/components/distances/DistanceTable";
import { distanceService } from "@/services/distances/distance.services";
import { AdminOrgMap, DistanceOperator, DistanceData, UserOrg } from "@/types/distances";
import dynamic from "next/dist/shared/lib/dynamic";
import { useEffect, useMemo, useState } from "react";

const Button = dynamic(
  () => import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.Button),
  { ssr: false },
);

const DistancesPage = () => {
  const { config } = useConfig();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Table data
  const [distanceTableData, setDistanceTableData] = useState<DistanceData[]>([]);

  // Dropdown options from data API calls
  const [adminOrgMapData, setAdminOrgMapData] = useState<AdminOrgMap[]>([]);
  const [operatorData, setOperatorData] = useState<DistanceOperator[]>([]);
  const [userOrgData, setUserOrgData] = useState<UserOrg[]>([]);

  // Selected dropdown options 
  const [selectedAdminAreas, setSelectedAdminAreas] = useState<string[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // TODO:NOW: Sort out dateSelect and add from/to timestamps to the filter
  const [fromDate, setFromDate] = useState(() => {
  const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });

  // Fetch dropdown options for filters
  useEffect(() => {
    if (!config?.apiUrl) {
      setAdminOrgMapData([]);
      setOperatorData([]);
      setUserOrgData([]);
      setIsLoading(false);
      console.error("API URL is not configured");
      return;
    }
    const load = async () => {
      setIsLoading(true);
              
      // Note that the API call for fetchDropdowns only returns operators, licenses and services
      const dropdownData = await distanceService.fetchDropdowns(config.apiUrl);
      const adminOrgMap = await distanceService.fetchAdminOrgList(config.apiUrl);
      const userOrgs = await distanceService.fetchUserOrgs(config.apiUrl);

      setAdminOrgMapData(adminOrgMap);
      setOperatorData(dropdownData.operators);
      setUserOrgData(userOrgs);
      setIsLoading(false);
    };

    load();
  }, [config?.apiUrl]);

  // Derive dropdown options (String) from data (Object)
  // Ensure there are no duplicate options and that they are in alphabetical order
  const adminAreaOptions = useMemo(() => {
        return Array.from(new Set(adminOrgMapData.map((adminArea) => adminArea.adminName))).sort();
  }, [adminOrgMapData]);

  const orgOptions = useMemo(() => {
    return Array.from(new Set(userOrgData.map((org) => org.name))).sort();
  }, [userOrgData]);

  const operatorOptions = useMemo(() => {
    return Array.from(new Set(operatorData.map((operator) => operator.name))).sort();
  }, [operatorData]);

  // Only show licenses and services relevant to selected operators (if any), otherwise show all
  const licenseOptions = useMemo(() => {
    const relevantOperators = selectedOperators.length > 0
      ? operatorData.filter((operator) => selectedOperators.includes(operator.name))
      : operatorData;
    return Array.from(new Set(
      relevantOperators.flatMap((operator) => operator.licenses.map((license) => license.id))
    )).sort();
  }, [operatorData, selectedOperators]);

  const serviceOptions = useMemo(() => {
    const relevantOperators = selectedOperators.length > 0
      ? operatorData.filter((operator) => selectedOperators.includes(operator.name))
      : operatorData;
    return Array.from(new Set(
      relevantOperators.flatMap((operator) =>
        operator.licenses.flatMap((license) => license.services.map((service) => service.name))
      )
    )).sort();
  }, [operatorData, selectedOperators]);

  const handleGenerateDataButton = async () => {
    if (!config?.apiUrl) {
      setDistanceTableData([]);
      setIsLoading(false);
      console.error("API URL is not configured");
      return;
    }

    // Get IDs for dropdown filtering
    const adminAreaIds = adminOrgMapData
    .filter((adminArea) => selectedAdminAreas.includes(adminArea.adminName))
    .map((adminArea) => adminArea.adminAreaId.toString());

    const operatorIds = operatorData
    .filter((operator) => selectedOperators.includes(operator.name))
    .map((operator) => operator.id);

    const orgId = userOrgData
      .find((org) => selectedOrgs.includes(org.name))
      ?.id.toString();

    const licenseIds = operatorData
      .flatMap((operator) => operator.licenses)
      .filter((license) => selectedLicenses.includes(license.id))
      .map((license) => license.id);

    const nocLineAndServiceCodes = operatorData
      .flatMap((operator) => operator.licenses.flatMap((license) => license.services))
      .filter((service) => selectedServices.includes(service.name))
      .map((service) => service.id);

    // Fetch data for table based on filter selections
    // TODO:NOW: Sort out dateSelect and add from/to timestamps to the filter

    const data = await distanceService.fetchDistances(
      config.apiUrl, 
      {
        orgId, 
        operatorIds, 
        fromTimestamp: fromDate.toISOString(),
        toTimestamp: toDate.toISOString(),
        nocLineAndServiceCodes, 
        licenseIds,
        adminAreaIds,
      });
    setDistanceTableData(data);
  }

  return (
    <BaseLayout title="Dashboard - Analyse Bus Open Data">
      <div className="app-page feed-monitoring-page">
        <h1 className="govuk-heading-xl app-page-header">Distances</h1>
        <DistanceFilters
          adminAreaOptions={adminAreaOptions}
          selectedAdminAreas={selectedAdminAreas}
          onAdminAreasChange={setSelectedAdminAreas}
          orgOptions={orgOptions}
          selectedOrgs={selectedOrgs}
          onOrgsChange={setSelectedOrgs}
          operatorOptions={operatorOptions}
          selectedOperators={selectedOperators}
          onOperatorsChange={setSelectedOperators}
          licenseOptions={licenseOptions}
          selectedLicenses={selectedLicenses}
          onLicensesChange={setSelectedLicenses}
          serviceOptions={serviceOptions}
          selectedServices={selectedServices}
          onServicesChange={setSelectedServices}
        />
        <Button onClick={handleGenerateDataButton} disabled={isGenerating || isLoading}>
          {isGenerating ? "Loading..." : "Generate"}
        </Button>
        <DistanceTable data={distanceTableData} />
      </div>
    </BaseLayout>
)};

export default DistancesPage;
