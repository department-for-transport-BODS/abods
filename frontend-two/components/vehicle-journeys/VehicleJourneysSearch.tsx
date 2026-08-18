import { clsx } from "clsx";
import styles from "./vehicle-journeys-search.module.scss";
import Link from "next/link";
import { NextRouter } from "next/router";
import { Interval } from "luxon";
import ExclamationInCircleIcon from "@/assets/icons/exclamation-in-circle.svg";
import { ArrowLeftIcon } from "../icons/ArrowLeftIcon";
import { ArrowRightIcon } from "../icons/ArrowRightIcon";
import { DateSelect } from "@/components/shared/DateSelect/DateSelect";
import { MultiselectCheckbox } from "@/components/shared/MultiselectCheckbox/MultiselectCheckbox";
import { Spinner } from "@/components/shared/Spinner";
import {
  VehicleJourneyLine,
  VehicleJourneyOperator,
  VehicleJourneySummary,
} from "@/types/vehicle-journeys";
import {
  formatDate,
  formatJourneyStartTime,
} from "@/components/vehicle-journeys/vehicleJourneysUtils";

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

  router.replace(
    { pathname: "/vehicle-journeys", query: nextQuery },
    undefined,
    {
      shallow: true,
    },
  );
};

const groupedJourneys = (journeys: VehicleJourneySummary[]) =>
  journeys.reduce<Record<string, VehicleJourneySummary[]>>(
    (groups, journey) => {
      const key = journey.serviceName;
      return { ...groups, [key]: [...(groups[key] ?? []), journey] };
    },
    {},
  );

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
  const operatorOptions = operators.map((operator) => ({
    label: `${operator.name} (${operator.operatorId})`,
    value: operator.operatorId,
  }));
  const serviceOptions = services.map((service) => ({
    label: `${service.number}: ${service.name}`,
    value: service.id,
  }));
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
      <div className={styles.controls}>
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

        <div className={styles.operator}>
          <MultiselectCheckbox
            id="vehicle-journeys-operator"
            label="Operator"
            options={operatorOptions}
            selectedValues={selectedOperatorId ? [selectedOperatorId] : []}
            allowMultiselect={false}
            onChange={([selected]) => {
              updateQuery(router, {
                operator: selected ?? null,
                service: null,
              });
            }}
            placeholder={operatorsLoading ? "Loading..." : "Select"}
            showAll={false}
          />
        </div>

        <div className={styles.service}>
          <MultiselectCheckbox
            id="vehicle-journeys-service"
            label="Service name"
            options={serviceOptions}
            selectedValues={selectedServiceId ? [selectedServiceId] : []}
            allowMultiselect={false}
            disabled={!selectedOperatorId || servicesLoading}
            onChange={([selected]) => {
              updateQuery(router, { service: selected ?? null });
            }}
            placeholder={servicesLoading ? "Loading..." : "Select"}
          />
        </div>
      </div>

      {selectedServiceId && !dateError ? (
        <nav
          className={clsx("govuk-pagination", styles.journeySearchNav)}
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
          <span className={styles.journeySearchNavDate}>
            {formatDate(selectedDate)}
          </span>
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
        <div className={styles.loading} aria-live="polite">
          <Spinner size="small" />
          <span className="govuk-visually-hidden">Loading journeys</span>
          <div
            className={clsx(
              styles.journeySearchGrid,
              styles.journeySearchGridSkeleton,
            )}
            aria-hidden="true"
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className={styles.journeySearchGridSkeletonItem}
              />
            ))}
          </div>
        </div>
      ) : null}

      {!dateError && patterns.length > 0
        ? patterns.map((pattern, index) => (
            <div key={pattern[0].serviceName}>
              <h2 className="govuk-heading-m govuk-!-margin-top-6">
                {pattern[0].serviceNumber}: {pattern[0].serviceName}
              </h2>
              <div className={styles.journeySearchGrid}>
                {pattern.map((journey) => (
                  <div
                    key={`${journey.groupId}-${journey.directionRef ?? ""}-${journey.startTime}`}
                  >
                    <Link
                      className={clsx(
                        "govuk-link",
                        "govuk-body",
                        styles.journeySearchGridTime,
                      )}
                      href={{
                        pathname: "/vehicle-journeys/[journeyId]",
                        query: {
                          journeyId: journey.groupId,
                          date: selectedDate,
                          operator: selectedOperatorId ?? "",
                          service: selectedServiceId ?? "",
                          ...(journey.directionRef
                            ? { direction: journey.directionRef }
                            : {}),
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
        : null}

      {noJourneysFound ? (
        <div className="govuk-body govuk-!-margin-top-8" role="alert">
          No journeys found
        </div>
      ) : null}

      {journeysErrored ? (
        <div
          className={clsx("govuk-body", "govuk-!-margin-top-8", styles.error)}
          role="alert"
        >
          <ExclamationInCircleIcon
            className={styles.errorIcon}
            aria-hidden="true"
            focusable="false"
          />
          <span>
            Sorry, there is a problem finding vehicle journeys. Please try
            again.
          </span>
        </div>
      ) : null}
    </>
  );
};
