import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import useSWR from "swr";
import { useRouter } from "next/router";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { VehicleJourneyDetail } from "@/components/vehicle-journeys/VehicleJourneyDetail";
import { VehicleJourneysSearch } from "@/components/vehicle-journeys/VehicleJourneysSearch";
import {
  getDefaultJourneyDate,
  getJourneyDateFromStartTime,
  getDistinct,
  getInitialVehicleRef,
  getValidDateRange,
  isDateInRange,
  normaliseJourneyDirection,
} from "@/components/vehicle-journeys/vehicleJourneysUtils";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { vehicleJourneysService } from "@/services/vehicle-journeys/vehicle-journeys.service";
import { ErrorInfo } from "@/types";

const getQueryString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const VehicleJourneysPage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const router = useRouter();
  const [selectedVehicleRef, setSelectedVehicleRef] = useState<string | null>(
    null,
  );
  const isDetailRoutePending =
    router.pathname === "/vehicle-journeys/[journeyId]" && !router.isReady;

  const journeyId = getQueryString(router.query.journeyId) ?? null;
  const queryDate = getQueryString(router.query.date);
  const queryStartTime = getQueryString(router.query.startTime);
  const fallbackDate = getJourneyDateFromStartTime(queryStartTime);
  const defaultDate = getDefaultJourneyDate(
    config?.vehicleJourneys.validDateRange.offsetISO,
  );
  const requestedDate = queryDate ?? fallbackDate;
  const validDateRange = getValidDateRange(
    config?.vehicleJourneys.validDateRange.offsetISO,
    config?.vehicleJourneys.validDateRange.durationISO,
  );
  const dateInRange = requestedDate
    ? isDateInRange(
        requestedDate,
        config?.vehicleJourneys.validDateRange.offsetISO,
        config?.vehicleJourneys.validDateRange.durationISO,
      )
    : true;
  const dateError =
    requestedDate && !dateInRange
      ? "Must be within the last 6 months"
      : undefined;
  const selectedDate = requestedDate ?? defaultDate ?? "";
  const fetchDate = dateInRange ? selectedDate : defaultDate ?? selectedDate;
  const selectedOperatorId = getQueryString(router.query.operator) ?? null;
  const selectedServiceId = getQueryString(router.query.service) ?? null;
  const selectedDirectionRef = normaliseJourneyDirection(
    getQueryString(router.query.direction),
  );
  const previousDateValue = DateTime.fromISO(fetchDate).minus({ days: 1 });
  const nextDateValue = DateTime.fromISO(fetchDate).plus({ days: 1 });
  const previousDate = validDateRange.contains(previousDateValue)
    ? previousDateValue.toISODate()
    : null;
  const nextDate = validDateRange.contains(nextDateValue)
    ? nextDateValue.toISODate()
    : null;

  const { data: operators = [], isLoading: operatorsLoading } = useSWR(
    config?.apiUrl && !isDetailRoutePending
      ? ["vehicle-journeys-operators"]
      : null,
    () => vehicleJourneysService.fetchOperators(),
  );
  const { data: services = [], isLoading: servicesLoading } = useSWR(
    config?.apiUrl && !isDetailRoutePending && selectedOperatorId && !dateError
      ? ["vehicle-journeys-services", selectedOperatorId, fetchDate]
      : null,
    ([, operatorId, date]) =>
      vehicleJourneysService.fetchLines(operatorId, date),
  );
  const { data: journeys, isLoading: journeysLoading } = useSWR(
    config?.apiUrl && !isDetailRoutePending && selectedServiceId && !dateError
      ? ["vehicle-journeys-day", fetchDate, selectedServiceId]
      : null,
    ([, date, serviceId]) =>
      vehicleJourneysService.fetchDayJourneys(date, serviceId),
  );
  const { data: journeyInfo, isLoading: journeyInfoLoading } = useSWR(
    config?.apiUrl && !isDetailRoutePending && journeyId && selectedServiceId
      ? ["vehicle-journey", journeyId, selectedServiceId]
      : null,
    ([, groupId, serviceId]) =>
      vehicleJourneysService.fetchJourney(groupId, serviceId),
  );

  const allStops = journeyInfo?.stops ?? [];
  const stops = allStops.filter(
    (stop) =>
      selectedDirectionRef === null ||
      normaliseJourneyDirection(stop.directionRef) === selectedDirectionRef,
  );
  const rawAvls = (journeyInfo?.avls ?? [])
    .filter(
      (avl) =>
        selectedDirectionRef === null ||
        normaliseJourneyDirection(avl.directionRef) === selectedDirectionRef,
    )
    .sort((left, right) =>
      left.recordedAtTimeUtc.localeCompare(right.recordedAtTimeUtc),
    );
  const vehicles = getDistinct(rawAvls, (avl) => avl.vehicleRef);
  const initialVehicleRef = getInitialVehicleRef(stops, rawAvls);
  const vehicleRef =
    selectedVehicleRef && vehicles.includes(selectedVehicleRef)
      ? selectedVehicleRef
      : initialVehicleRef;
  const avls = rawAvls.filter((avl) => avl.vehicleRef === vehicleRef);
  const currentJourneyIndex = Array.isArray(journeys)
    ? journeys.findIndex(
        (journey) =>
          journey.groupId === journeyId &&
          normaliseJourneyDirection(journey.directionRef) ===
            selectedDirectionRef,
      )
    : -1;
  const currentJourney =
    Array.isArray(journeys) && currentJourneyIndex >= 0
      ? journeys[currentJourneyIndex]
      : null;

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    setSelectedVehicleRef(null);
  }, [
    router.isReady,
    journeyId,
    fetchDate,
    selectedServiceId,
    selectedDirectionRef,
  ]);

  const { data: routeGeometry } = useSWR(
    config?.apiUrl && !isDetailRoutePending && currentJourney?.vehicleJourneyId
      ? [
          "vehicle-journey-service-pattern-distance",
          currentJourney.vehicleJourneyId.toString(),
        ]
      : null,
    ([, vehicleJourneyId]) =>
      vehicleJourneysService.fetchServicePatternDistanceGeom(vehicleJourneyId),
  );

  const errors: ErrorInfo[] = !config?.apiUrl
    ? [
        {
          id: "config-error",
          errorMessage: "Unable to load configuration. Please try again later.",
        },
      ]
    : [];

  if (isDetailRoutePending) {
    return (
      <BaseLayout title="Vehicle journeys - Analyse Bus Open Data">
        <span className="govuk-caption-xl">Vehicle journeys</span>
        <h1 className="govuk-heading-xl">Loading journey details</h1>
        <p className="govuk-body">Loading...</p>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout title="Vehicle journeys - Analyse Bus Open Data">
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds-from-desktop">
          <ErrorSummary errors={errors} />
        </div>
      </div>
      {journeyId ? (
        <VehicleJourneyDetail
          router={router}
          journeyId={journeyId}
          dateOfJourney={fetchDate}
          operatorId={selectedOperatorId}
          serviceId={selectedServiceId}
          directionRef={selectedDirectionRef}
          journeyInfo={journeyInfo ? { stops, avls } : journeyInfo}
          journeyInfoLoading={journeyInfoLoading}
          journeys={journeys}
          journeysLoading={journeysLoading}
          currentJourney={currentJourney}
          currentJourneyIndex={currentJourneyIndex}
          vehicles={vehicles}
          vehicleRef={vehicleRef}
          onVehicleRefChange={setSelectedVehicleRef}
          avls={avls}
          rawAvls={rawAvls}
          routeGeometry={routeGeometry}
          viewportKey={`${journeyId ?? ""}-${fetchDate}-${selectedServiceId ?? ""}-${selectedDirectionRef ?? ""}`}
        />
      ) : (
        <VehicleJourneysSearch
          router={router}
          selectedDate={selectedDate}
          selectedOperatorId={selectedOperatorId}
          selectedServiceId={selectedServiceId}
          operators={operators}
          services={services}
          journeys={journeys}
          operatorsLoading={operatorsLoading}
          servicesLoading={servicesLoading}
          journeysLoading={journeysLoading}
          previousDate={previousDate}
          nextDate={nextDate}
          validDateRange={validDateRange}
          dateError={dateError}
        />
      )}
    </BaseLayout>
  );
};

export default VehicleJourneysPage;
