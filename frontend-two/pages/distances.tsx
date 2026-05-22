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
      try {
        // Note that the query for fetchDropdownInputs only returns operators, licenses and services
        setDropdownInputsData(await distanceService.fetchDropdownInputs(config.apiUrl));
        setAdminOrgData(await distanceService.fetchAdminOrg(config.apiUrl));
      } catch (err) {
        console.error("Failed to load filter options:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [config?.apiUrl]);

  // Derive dropdown options with cross-filtering: each dropdown's options are narrowed by all other current selections. 
  // Admin area 
  const adminAreaOptions = useMemo(() => {
    let opIds: Set<string> | null = null;

    if (selectedOrgs.length > 0) {
      opIds = new Set(adminOrgData.filter(d => selectedOrgs.includes(d.orgName)).map(d => d.operatorId));
    }

    const relevantOps = dropdownInputsData.operators.filter(op => {
      if (opIds && !opIds.has(op.id)) return false;
      if (selectedOperators.length > 0 && !selectedOperators.includes(`${op.name} (${op.id})`)) return false;
      if (selectedLicenses.length > 0 && !op.licenses.some(l => selectedLicenses.includes(l.id))) return false;
      if (selectedServices.length > 0 && !op.licenses.some(l => l.services.some(s => selectedServices.includes(`${s.line}-${s.name}`)))) return false;
      return true;
    });

    const relevantOpIds = new Set(relevantOps.map(op => op.id));
    
    return Array.from(new Set(
      adminOrgData.filter(d => relevantOpIds.has(d.operatorId)).map(d => d.adminName)
    )).sort();
  }, [adminOrgData, dropdownInputsData.operators, selectedOrgs, selectedOperators, selectedLicenses, selectedServices]);

  // Organisation
  const orgOptions = useMemo(() => {
    let opIds: Set<string> | null = null;

    if (selectedAdminAreas.length > 0) {
      opIds = new Set(adminOrgData.filter(d => selectedAdminAreas.includes(d.adminName)).map(d => d.operatorId));
    }
    const relevantOps = dropdownInputsData.operators.filter(op => {
      if (opIds && !opIds.has(op.id)) return false;
      if (selectedOperators.length > 0 && !selectedOperators.includes(`${op.name} (${op.id})`)) return false;
      if (selectedLicenses.length > 0 && !op.licenses.some(l => selectedLicenses.includes(l.id))) return false;
      if (selectedServices.length > 0 && !op.licenses.some(l => l.services.some(s => selectedServices.includes(`${s.line}-${s.name}`)))) return false;
      return true;
    });

    const relevantOpIds = new Set(relevantOps.map(op => op.id));
    
    return Array.from(new Set(
      adminOrgData.filter(d => relevantOpIds.has(d.operatorId)).map(d => d.orgName)
    )).sort();
  }, [adminOrgData, dropdownInputsData.operators, selectedAdminAreas, selectedOperators, selectedLicenses, selectedServices]);

  // Operator
  const operatorOptions = useMemo(() => {

    let opIds: Set<string> | null = null;
    
    if (selectedAdminAreas.length > 0) {
      opIds = new Set(adminOrgData.filter(d => selectedAdminAreas.includes(d.adminName)).map(d => d.operatorId));
    }
    
    if (selectedOrgs.length > 0) {
      const orgOpIds = new Set(adminOrgData.filter(d => selectedOrgs.includes(d.orgName)).map(d => d.operatorId));
      opIds = opIds ? new Set([...opIds].filter(id => orgOpIds.has(id))) : orgOpIds;
    }

    return Array.from(new Set(
      dropdownInputsData.operators
        .filter(op => {
          if (opIds && !opIds.has(op.id)) return false;
          if (selectedLicenses.length > 0 && !op.licenses.some(l => selectedLicenses.includes(l.id))) return false;
          if (selectedServices.length > 0 && !op.licenses.some(l => l.services.some(s => selectedServices.includes(`${s.line}-${s.name}`)))) return false;
          return true;
        })
        .map(op => `${op.name} (${op.id})`)
    )).sort();
  }, [adminOrgData, dropdownInputsData.operators, selectedAdminAreas, selectedOrgs, selectedLicenses, selectedServices]);

  // Clear selections that are no longer valid when options narrow
  useEffect(() => {
    setSelectedAdminAreas(prev => prev.filter(a => adminAreaOptions.includes(a)));
  }, [adminAreaOptions]);

  useEffect(() => {
    setSelectedOrgs(prev => prev.filter(o => orgOptions.includes(o)));
  }, [orgOptions]);

  useEffect(() => {
    setSelectedOperators(prev => prev.filter(op => operatorOptions.includes(op)));
  }, [operatorOptions]);

  const licenseOptions = useMemo(() => {
    let opIds: Set<string> | null = null;

    if (selectedAdminAreas.length > 0) {
      opIds = new Set(adminOrgData.filter(d => selectedAdminAreas.includes(d.adminName)).map(d => d.operatorId));
    }
    if (selectedOrgs.length > 0) {
      const orgOpIds = new Set(adminOrgData.filter(d => selectedOrgs.includes(d.orgName)).map(d => d.operatorId));
      opIds = opIds ? new Set([...opIds].filter(id => orgOpIds.has(id))) : orgOpIds;
    }

    const relevantOps = dropdownInputsData.operators.filter(op => {
      if (opIds && !opIds.has(op.id)) return false;
      if (selectedOperators.length > 0 && !selectedOperators.includes(`${op.name} (${op.id})`)) return false;
      return true;
    });

    return Array.from(new Set(
      relevantOps.flatMap(op =>
        op.licenses
          .filter(l => selectedServices.length === 0 || l.services.some(s => selectedServices.includes(`${s.line}-${s.name}`)))
          .map(l => l.id)
      )
    )).sort();
  }, [adminOrgData, dropdownInputsData.operators, selectedAdminAreas, selectedOrgs, selectedOperators, selectedServices]);

  const serviceOptions = useMemo(() => {
    let opIds: Set<string> | null = null;

    if (selectedAdminAreas.length > 0) {
      opIds = new Set(adminOrgData.filter(d => selectedAdminAreas.includes(d.adminName)).map(d => d.operatorId));
    }
    if (selectedOrgs.length > 0) {
      const orgOpIds = new Set(adminOrgData.filter(d => selectedOrgs.includes(d.orgName)).map(d => d.operatorId));
      opIds = opIds ? new Set([...opIds].filter(id => orgOpIds.has(id))) : orgOpIds;
    }

    const relevantOps = dropdownInputsData.operators.filter(op => {
      if (opIds && !opIds.has(op.id)) return false;
      if (selectedOperators.length > 0 && !selectedOperators.includes(`${op.name} (${op.id})`)) return false;
      return true;
    });
    
    return Array.from(new Set(
      relevantOps.flatMap(op =>
        op.licenses
          .filter(l => selectedLicenses.length === 0 || selectedLicenses.includes(l.id))
          .flatMap(l => l.services.map(s => `${s.line}-${s.name}`))
      )
    )).sort();
  }, [adminOrgData, dropdownInputsData.operators, selectedAdminAreas, selectedOrgs, selectedOperators, selectedLicenses]);

  useEffect(() => {
    setSelectedLicenses(prev => prev.filter(l => licenseOptions.includes(l)));
  }, [licenseOptions]);

  useEffect(() => {
    setSelectedServices(prev => prev.filter(s => serviceOptions.includes(s)));
  }, [serviceOptions]);

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

    // If no operators explicitly selected but orgs are selected, resolve operator IDs from org membership
    let operatorIdsToSend: string[] = operatorIds;
    if (operatorIds.length === 0 && selectedOrgs.length > 0) {
      operatorIdsToSend = Array.from(new Set(
        adminOrgData
          .filter(d => selectedOrgs.includes(d.orgName))
          .map(d => d.operatorId)
      ));
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
    try {
      const data = await distanceService.fetchDistances(
        config.apiUrl,
        {
          operatorIds: operatorIdsToSend,
          fromTimestamp: fromDate,
          toTimestamp: toDate,
          nocLineAndServiceCodes: serviceIds,
          licenseIds,
          adminAreaIds,
        });
      setDistanceTableData(data);
    } catch (err) {
      console.error("Failed to fetch distances:", err);
    } finally {
      setIsGenerating(false);
    }
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
