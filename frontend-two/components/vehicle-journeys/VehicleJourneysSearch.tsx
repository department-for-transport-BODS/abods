import Link from "next/link";
import { NextRouter } from "next/router";
import { Interval } from "luxon";
import ExclamationInCircleIcon from "@/assets/icons/exclamation-in-circle.svg";
import { ArrowLeftIcon } from "../icons/ArrowLeftIcon";
import { ArrowRightIcon } from "../icons/ArrowRightIcon";
import { DateSelect } from "@/components/shared/DateSelect";
import { MultiselectDropdown } from "@/components/shared/MultiselectDropdown";
import { Spinner } from "@/components/shared/Spinner";
import {
  VehicleJourneyLine,
  VehicleJourneyOperator,
  VehicleJourneySummary,
} from "@/types/vehicle-journeys";
import { formatDate, formatJourneyStartTime } from "@/components/vehicle-journeys/vehicleJourneysUtils";

interface VehicleJourneysSearchProps {
  router: NextRouter;
  selectedDate: string;
  selectedOperatorId: string | null;
  selectedServiceId: string | null;
  operators: VehicleJourneyOperator[];
  services: VehicleJourneyLine[];
  journeys: VehicleJourneySummary[] | null | undefined;
  operatorsLoading: boolean;
  servicesLoading: boolean;
  journeysLoading: boolean;
  previousDate: string | null;
  nextDate: string | null;
  validDateRange: Interval;
  dateError?: string;
}

const updateQuery = (
  router: NextRouter,
  query: Record<string, string | null>,
) => {
  const nextQuery = { ...router.query };

  Object.entries(query).forEach(([key, value]) => {
    if (!value) {
      delete nextQuery[key];
      return;
    }
    nextQuery[key] = value;
  });

  router.replace({ pathname: "/vehicle-journeys", query: nextQuery }, undefined, {
    shallow: true,
  });
};

const groupedJourneys = (journeys: VehicleJourneySummary[]) =>
  journeys.reduce<Record<string, VehicleJourneySummary[]>>((groups, journey) => {
    const key = journey.serviceName;
    return { ...groups, [key]: [...(groups[key] ?? []), journey] };
  }, {});

export const VehicleJourneysSearch = ({
  router,
  selectedDate,
  selectedOperatorId,
  selectedServiceId,
  operators,
  services,
  journeys,
  operatorsLoading,
  servicesLoading,
  journeysLoading,
  previousDate,
  nextDate,
  validDateRange,
  dateError,
}: VehicleJourneysSearchProps) => {
  const operatorOptions = operators.map(
    (operator) => `${operator.name} (${operator.operatorId})`,
  );
  const selectedOperator = selectedOperatorId
    ? operators.find((operator) => operator.operatorId === selectedOperatorId)
    : null;
  const selectedOperatorOption = selectedOperator
    ? `${selectedOperator.name} (${selectedOperator.operatorId})`
    : null;
  const serviceOptions = services.map(
    (service) => `${service.number}: ${service.name}`,
  );
  const selectedService = selectedServiceId
    ? services.find((service) => service.id === selectedServiceId)
    : null;
  const selectedServiceOption = selectedService
    ? `${selectedService.number}: ${selectedService.name}`
    : null;
  const patterns = Object.values(groupedJourneys(journeys ?? []));
  const noJourneysFound =
    !journeysLoading &&
    Array.isArray(journeys) &&
    journeys.length === 0 &&
    selectedServiceId &&
    !dateError;
  const journeysErrored =
    !journeysLoading && journeys === null && selectedServiceId && !dateError;

  return (
    <>
      <h1 className="govuk-heading-xl">Vehicle journeys</h1>
      <div className="vehicle-journeys-search__controls">
        <DateSelect
          label="Date"
          inputId="vehicle-journeys-date"
          value={selectedDate}
          validRange={validDateRange}
          error={dateError}
          onChange={(date) => {
            updateQuery(router, {
              date,
              service: null,
            });
          }}
        />

        <div className="vehicle-journeys-search__operator">
          <MultiselectDropdown
            multiSelect={false}
            label="Operator"
            options={operatorOptions}
            selected={selectedOperatorOption ? [selectedOperatorOption] : []}
            onChange={([selected]) => {
              const operator = operators.find(
                (item) => `${item.name} (${item.operatorId})` === selected,
              );
              updateQuery(router, {
                operator: operator?.operatorId ?? null,
                service: null,
              });
            }}
            placeholderText={operatorsLoading ? "Loading..." : "Select"}
          />
        </div>

        <div className="vehicle-journeys-search__service">
          <MultiselectDropdown
            multiSelect={false}
            label="Service name"
            options={serviceOptions}
            selected={selectedServiceOption ? [selectedServiceOption] : []}
            disabled={!selectedOperatorId || servicesLoading}
            clearable
            onChange={([selected]) => {
              const service = services.find(
                (item) => `${item.number}: ${item.name}` === selected,
              );
              updateQuery(router, { service: service?.id ?? null });
            }}
            placeholderText={servicesLoading ? "Loading..." : "Select"}
          />
        </div>
      </div>

      {selectedServiceId && !dateError ? (
        <nav
          className="govuk-pagination journey-search-nav"
          role="navigation"
          aria-label="results"
        >
          <div className="govuk-pagination__prev">
            {previousDate ? (
              <button
                type="button"
                className="govuk-link govuk-pagination__link unbuttoned"
                onClick={() => updateQuery(router, { date: previousDate })}
              >
                <ArrowLeftIcon className="govuk-pagination__icon govuk-pagination__icon--prev" />
                <span className="govuk-pagination__link-title">Previous</span>
              </button>
            ) : null}
          </div>
          <span className="journey-search-nav__date">{formatDate(selectedDate)}</span>
          <div className="govuk-pagination__next">
            {nextDate ? (
              <button
                type="button"
                className="govuk-link govuk-pagination__link unbuttoned"
                onClick={() => updateQuery(router, { date: nextDate })}
              >
                <span className="govuk-pagination__link-title">Next</span>
                <ArrowRightIcon className="govuk-pagination__icon govuk-pagination__icon--next" />
              </button>
            ) : null}
          </div>
        </nav>
      ) : null}

      {journeysLoading && !dateError ? (
        <div className="vehicle-journeys-search__loading" aria-live="polite">
          <Spinner size="small" />
          <span className="govuk-visually-hidden">Loading journeys</span>
          <div className="journey-search-grid journey-search-grid--skeleton" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="journey-search-grid__skeleton-item" />
            ))}
          </div>
        </div>
      ) : null}

      {!dateError && patterns.length > 0 ? (
        patterns.map((pattern, index) => (
          <div key={pattern[0].serviceName}>
            <h2 className="govuk-heading-m govuk-!-margin-top-6">
              {pattern[0].serviceNumber}: {pattern[0].serviceName}
            </h2>
            <div className="journey-search-grid">
              {pattern.map((journey) => (
                <div key={`${journey.groupId}-${journey.directionRef ?? ""}-${journey.startTime}`}>
                  <Link
                    className="govuk-link govuk-body journey-search-grid__time"
                    href={{
                      pathname: "/vehicle-journeys/[journeyId]",
                      query: {
                        journeyId: journey.groupId,
                        date: selectedDate,
                        operator: selectedOperatorId ?? "",
                        service: selectedServiceId ?? "",
                        ...(journey.directionRef ? { direction: journey.directionRef } : {}),
                      },
                    }}
                  >
                    {formatJourneyStartTime(journey)}
                  </Link>
                </div>
              ))}
            </div>
            {index < patterns.length - 1 ? <hr /> : null}
          </div>
        ))
      ) : null}

      {noJourneysFound ? (
        <div className="govuk-body govuk-!-margin-top-8" role="alert">
          No journeys found
        </div>
      ) : null}

      {journeysErrored ? (
        <div
          className="govuk-body govuk-!-margin-top-8 vehicle-journeys-search__error"
          role="alert"
        >
          <ExclamationInCircleIcon
            className="vehicle-journeys-search__error-icon"
            aria-hidden="true"
            focusable="false"
          />
          <span>
            Sorry, there is a problem finding vehicle journeys. Please try again.
          </span>
        </div>
      ) : null}
    </>
  );
};
