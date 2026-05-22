import { useConfig } from "@/contexts/ConfigContext";
import { BaseLayout } from "../components/layout/BaseLayout";
import { DistanceFilters} from "../components/distances/DistanceFilters";
import { DistanceTable } from "@/components/distances/DistanceTable";
import { distanceService } from "@/services/distances/distance.services";
import { AdminOrgMap, DistanceData, DistancesDropdowns } from "@/types/distances";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {formatDateToISODateString} from "@/utils/dateFormatter";
import { DateTime } from "luxon";

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
  const [dropdownInputsData, setDropdownInputsData] = useState<DistancesDropdowns>({ operators: [] });
  const [adminOrgData, setAdminOrgData] = useState<AdminOrgMap[]>([]);

  // Selected dropdown options 
  const [selectedAdminAreas, setSelectedAdminAreas] = useState<string[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Set default date range to past week
  const [toDate, setToDate] = useState(() => {
    return formatDateToISODateString(DateTime.now());
  });

  const [fromDate, setFromDate] = useState(() => {
    return formatDateToISODateString(DateTime.now().minus({ days: 7 }));
  });
  
  // Fetch dropdown options for filters
  // TODO:NOW: Add try catch and error handling
  useEffect(() => {
    if (!config?.apiUrl) {
      setDropdownInputsData({ operators: [] });
      setAdminOrgData([]);
      setIsLoading(false);
      console.error("API URL is not configured");
      return;
    }
    const load = async () => {
      setIsLoading(true);
              
      // Note that the query for fetchDropdownInputs only returns operators, licenses and services
      setDropdownInputsData(await distanceService.fetchDropdownInputs(config.apiUrl));
      setAdminOrgData(await distanceService.fetchAdminOrg(config.apiUrl));
      setIsLoading(false);
    };

    load();
  }, [config?.apiUrl]);

  // Derive dropdown options (String) from data (Object)
  // Ensure there are no duplicate options and that they are in alphabetical order
  const adminAreaOptions = useMemo(() => {
        return Array.from(new Set(adminOrgData.map((data) => data.adminName))).sort();
  }, [adminOrgData]);

  const orgOptions = useMemo(() => {
    return Array.from(new Set(adminOrgData.map((data) => data.orgName))).sort();
  }, [adminOrgData]);

  const operatorOptions = useMemo(() => {
    if (selectedOrgs.length === 0) {
      return Array.from(new Set(dropdownInputsData.operators.map((data) => `${data.name} (${data.id})`))).sort();
    }
    // Use AdminOrgMap to filter operators based on any selected orgs
    const orgOperatorIds = new Set(
      adminOrgData
        .filter((selected) => selectedOrgs.includes(selected.orgName))
        .map((selected) => selected.operatorId)
    );
    return Array.from(new Set(
      dropdownInputsData.operators
        .filter((data) => orgOperatorIds.has(data.id))
        .map((data) => `${data.name} (${data.id})`)
    )).sort();
  }, [dropdownInputsData.operators, adminOrgData, selectedOrgs]);

  // Clear selected operators that are no longer in the filtered operator options
  useEffect(() => {
    setSelectedOperators((prev) => prev.filter((op) => operatorOptions.includes(op)));
  }, [operatorOptions]);

  // Only show licenses and services relevant to selected operators (if any), otherwise show all
  const licenseOptions = useMemo(() => {
    const relevantOperators = selectedOperators.length > 0
      ? dropdownInputsData.operators.filter((operator) => selectedOperators.includes(`${operator.name} (${operator.id})`))
      : dropdownInputsData.operators;
    return Array.from(new Set(
      relevantOperators.flatMap((operator) => operator.licenses.map((license) => license.id))
    )).sort();
  }, [dropdownInputsData.operators, selectedOperators]);

  const serviceOptions = useMemo(() => {
    const relevantOperators = selectedOperators.length > 0
      ? dropdownInputsData.operators.filter((operator) => selectedOperators.includes(`${operator.name} (${operator.id})`))
      : dropdownInputsData.operators;
    return Array.from(new Set(
      relevantOperators.flatMap((operator) =>
        operator.licenses.flatMap((license) => license.services.map((service) => `${service.line}-${service.name}`))
      )
    )).sort();
  }, [dropdownInputsData.operators, selectedOperators]);

  const handleGenerateDataButton = async () => {
    if (!config?.apiUrl) {
      setDistanceTableData([]);
      setIsLoading(false);
      console.error("API URL is not configured");
      return;
    }
    setIsGenerating(true);

    // Get IDs for filtering
    const adminAreaIds = adminOrgData
    .filter((adminArea) => selectedAdminAreas.includes(adminArea.adminName))
    .map((adminArea) => adminArea.adminAreaId.toString());

    const operatorIds = dropdownInputsData.operators
    .filter((operator) => selectedOperators.includes(`${operator.name} (${operator.id})`))
    .map((operator) => operator.id);

    let orgId: string | undefined = undefined;
    let operatorIdsToSend: string[] = operatorIds;
    if (operatorIds.length === 0) {
      orgId = adminOrgData
        .find((org) => selectedOrgs.includes(org.orgName))
        ?.orgId.toString();
    } else {
      orgId = undefined;
      operatorIdsToSend = operatorIds;
    }

    const licenseIds = dropdownInputsData.operators
      .flatMap((operator) => operator.licenses)
      .filter((license) => selectedLicenses.includes(license.id))
      .map((license) => license.id);

    const serviceIds = dropdownInputsData.operators
      .flatMap((operator) => operator.licenses.flatMap((license) => license.services))
      .filter((service) => selectedServices.includes(`${service.line}-${service.name}`))
      .map((service) => service.id);

    // Fetch data for table based on filter selections
    // TODO:NOW: Add try catch and error handling
    const data = await distanceService.fetchDistances(
      config.apiUrl, 
      {
        orgId,
        operatorIds: operatorIdsToSend,
        fromTimestamp: fromDate,
        toTimestamp: toDate,
        nocLineAndServiceCodes: serviceIds, 
        licenseIds,
        adminAreaIds,
      });
    setDistanceTableData(data);
    setIsGenerating(false);
  }

  return (
    <BaseLayout title="Dashboard - Analyse Bus Open Data">
      <div className="app-page feed-monitoring-page">
        <h1 className="govuk-heading-xl app-page-header">Distances</h1>
        <DistanceFilters
          isLoading={isLoading}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
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
        <Button onClick={handleGenerateDataButton} disabled={isLoading || isGenerating}>
          {isLoading || isGenerating ? "Loading..." : "Generate"}
        </Button>
        <DistanceTable data={distanceTableData} />
      </div>
    </BaseLayout>
)};

export default DistancesPage;
