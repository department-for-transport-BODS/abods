import Link from "next/link";
import { NextRouter } from "next/router";
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
}: VehicleJourneysSearchProps) => {
  const patterns = Object.values(groupedJourneys(journeys ?? []));
  const noJourneysFound =
    !journeysLoading && Array.isArray(journeys) && journeys.length === 0 && selectedServiceId;
  const journeysErrored = !journeysLoading && journeys === null && selectedServiceId;

  return (
    <>
      <h1 className="govuk-heading-xl">Vehicle journeys</h1>
      <div className="vehicle-journeys-search__controls">
        <div className="govuk-form-group">
          <label className="govuk-label" htmlFor="vehicle-journeys-date">
            Date
          </label>
          <input
            className="govuk-input govuk-input--width-10"
            id="vehicle-journeys-date"
            type="date"
            value={selectedDate}
            onChange={(event) => {
              updateQuery(router, {
                date: event.target.value,
                service: null,
              });
            }}
          />
        </div>

        <div className="govuk-form-group vehicle-journeys-search__operator">
          <label className="govuk-label" htmlFor="vehicle-journeys-operator">
            Operator
          </label>
          <select
            className="govuk-select"
            id="vehicle-journeys-operator"
            value={selectedOperatorId ?? ""}
            disabled={operatorsLoading}
            onChange={(event) =>
              updateQuery(router, {
                operator: event.target.value || null,
                service: null,
              })
            }
          >
            <option value="">
              {operatorsLoading ? "Loading..." : "Select"}
            </option>
            {operators.map((operator) => (
              <option key={operator.operatorId} value={operator.operatorId}>
                {operator.name} ({operator.operatorId})
              </option>
            ))}
          </select>
        </div>

        <div className="govuk-form-group vehicle-journeys-search__service">
          <label className="govuk-label" htmlFor="vehicle-journeys-service">
            Service name
          </label>
          <select
            className="govuk-select"
            id="vehicle-journeys-service"
            value={selectedServiceId ?? ""}
            disabled={!selectedOperatorId || servicesLoading}
            onChange={(event) =>
              updateQuery(router, { service: event.target.value || null })
            }
          >
            <option value="">
              {servicesLoading ? "Loading..." : "Select"}
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.number}: {service.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedServiceId ? (
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
              </button>
            ) : null}
          </div>
        </nav>
      ) : null}

      {journeysLoading ? <p className="govuk-body">Loading...</p> : null}

      {patterns.length > 0 ? (
        patterns.map((pattern, index) => (
          <div key={pattern[0].serviceName}>
            <h2 className="govuk-heading-l govuk-!-margin-top-6">
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
                        direction: journey.directionRef ?? "",
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
        <div className="govuk-body govuk-!-margin-top-8" role="alert">
          Sorry, there is a problem finding vehicle journeys. Please try again.
        </div>
      ) : null}
    </>
  );
};
