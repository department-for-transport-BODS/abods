import styles from "./vehicle-journey-detail.module.scss";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NextRouter } from "next/router";
import tippy from "tippy.js";
import { CaretLeftIcon } from "@/components/icons/CaretLeftIcon";
import { CaretRightIcon } from "@/components/icons/CaretRightIcon";
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";
import { Spinner } from "@/components/shared/Spinner";
import { Stat } from "@/components/shared/SummaryStat/Stat";
import tooltipListStyles from "@/components/shared/SummaryStat/summary-stat-with-tooltip.module.scss";
import { Tooltip } from "@/components/shared/Tooltip";
import { clsx } from "clsx";
import { TimingIcon } from "@/components/icons/TimingIcon";
import { StopIcon } from "@/components/icons/StopIcon";
import { MatchType, StopTypeOption } from "@/src/generated/graphql";
import {
  ServicePatternDistanceGeom,
  VehicleJourneyAvl,
  VehicleJourneyInfo,
  VehicleJourneyStop,
  VehicleJourneySummary,
} from "@/types/vehicle-journeys";
import {
  calculateOtpStats,
  formatDelay,
  formatJourneyStartTime,
  formatLongDateTime,
  formatPercent,
  formatStopTime,
  getActualDeparture,
  getVehicleJourneyReturnHref,
  getStopOtp,
  incompleteIdToString,
} from "@/components/vehicle-journeys/vehicleJourneysUtils";
import { VehicleJourneyMap } from "@/components/vehicle-journeys/VehicleJourneyMap";

interface VehicleJourneyDetailProps {
  router: NextRouter;
  journeyId: string;
  dateOfJourney: string | null;
  operatorId: string | null;
  serviceId: string | null;
  directionRef: string | null;
  journeyInfo: VehicleJourneyInfo | null | undefined;
  journeyInfoLoading: boolean;
  journeys: VehicleJourneySummary[] | null | undefined;
  journeysLoading: boolean;
  currentJourney: VehicleJourneySummary | null;
  currentJourneyIndex: number;
  vehicles: string[];
  vehicleRef: string | null;
  onVehicleRefChange: (vehicleRef: string) => void;
  avls: VehicleJourneyAvl[];
  rawAvls: VehicleJourneyAvl[];
  routeGeometry: ServicePatternDistanceGeom | null | undefined;
  viewportKey: string;
}

const replaceQuery = (
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
  router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
    shallow: true,
  });
};

const getJourneyHref = (
  journey: VehicleJourneySummary,
  dateOfJourney: string | null,
  operatorId: string | null,
  serviceId: string | null,
  matchType: MatchType,
  stopType: StopTypeOption,
) => ({
  pathname: "/vehicle-journeys/[journeyId]",
  query: {
    journeyId: journey.groupId,
    ...(dateOfJourney ? { date: dateOfJourney } : {}),
    ...(operatorId ? { operator: operatorId } : {}),
    ...(serviceId ? { service: serviceId } : {}),
    startTime: journey.startTime,
    ...(journey.directionRef ? { direction: journey.directionRef } : {}),
    ...(matchType !== MatchType.Evidenced ? { match_type: matchType } : {}),
    ...(stopType === StopTypeOption.AllStops ? { allStops: "true" } : {}),
  },
});

const JourneySummaryList = ({
  journey,
  vehicleRef,
  distance,
}: {
  journey: VehicleJourneySummary | null;
  vehicleRef: string | null;
  distance?: number | null;
}) => (
  <dl className={clsx("govuk-summary-list", styles["vehicle-journeys__summary-list"])}>
    <div className="govuk-summary-list__row">
      <dt className="govuk-summary-list__key">Operator:</dt>
      <dd className="govuk-summary-list__value">
        {journey
          ? `${journey.operatorName} (${journey.operatorNoc})`
          : "Unknown"}
      </dd>
    </div>
    <div className="govuk-summary-list__row">
      <dt className="govuk-summary-list__key">Service pattern:</dt>
      <dd className="govuk-summary-list__value">
        {journey?.serviceName ?? "Unknown"}
      </dd>
    </div>
    <div className="govuk-summary-list__row">
      <dt className="govuk-summary-list__key">Scheduled start time:</dt>
      <dd className="govuk-summary-list__value">
        {journey ? formatLongDateTime(journey.startTime) : "Unknown"}
      </dd>
    </div>
    <div className="govuk-summary-list__row">
      <dt className="govuk-summary-list__key">Vehicle ID:</dt>
      <dd className="govuk-summary-list__value">{vehicleRef ?? "Unknown"}</dd>
    </div>
    <div className="govuk-summary-list__row">
      <dt className="govuk-summary-list__key">Scheduled distance (km):</dt>
      <dd className="govuk-summary-list__value">
        {typeof distance === "number"
          ? (distance / 1000).toString()
          : "Unknown"}
      </dd>
    </div>
  </dl>
);

const JourneyNavLink = ({
  href,
  tooltip,
  children,
}: {
  href: ReturnType<typeof getJourneyHref>;
  tooltip: string;
  children: React.ReactNode;
}) => {
  const linkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!linkRef.current) {
      return;
    }

    const instance = tippy(linkRef.current, {
      content: tooltip,
      allowHTML: true,
      theme: "gds-tooltip",
      zIndex: 100,
      placement: "top",
    });

    return () => {
      instance.destroy();
    };
  }, [tooltip]);

  return (
    <Link ref={linkRef} className={styles["journey-nav__link"]} href={href}>
      {children}
    </Link>
  );
};

const JourneyNav = ({
  journeys,
  currentJourneyIndex,
  dateOfJourney,
  operatorId,
  serviceId,
  matchType,
  stopType,
}: {
  journeys: VehicleJourneySummary[];
  currentJourneyIndex: number;
  dateOfJourney: string | null;
  operatorId: string | null;
  serviceId: string | null;
  matchType: MatchType;
  stopType: StopTypeOption;
}) => {
  const previous =
    currentJourneyIndex > 0 ? journeys[currentJourneyIndex - 1] : null;
  const next =
    currentJourneyIndex >= 0 && currentJourneyIndex < journeys.length - 1
      ? journeys[currentJourneyIndex + 1]
      : null;
  const previousIcon = <CaretLeftIcon className={styles["journey-nav__icon"]} />;
  const nextIcon = <CaretRightIcon className={styles["journey-nav__icon"]} />;

  return (
    <div className={styles["journey-nav"]}>
      <span>Journey</span>
      {previous ? (
        <JourneyNavLink
          href={getJourneyHref(
            previous,
            dateOfJourney,
            operatorId,
            serviceId,
            matchType,
            stopType,
          )}
          tooltip={`${previous.serviceNumber}: ${previous.serviceName}`}
        >
          {previousIcon}
          <span>{formatJourneyStartTime(previous)}</span>
        </JourneyNavLink>
      ) : (
        <span className={clsx(styles["journey-nav__link"], styles["journey-nav__link--disabled"])}>
          {previousIcon}
        </span>
      )}
      {next ? (
        <JourneyNavLink
          href={getJourneyHref(
            next,
            dateOfJourney,
            operatorId,
            serviceId,
            matchType,
            stopType,
          )}
          tooltip={`${next.serviceNumber}: ${next.serviceName}`}
        >
          <span>{formatJourneyStartTime(next)}</span>
          {nextIcon}
        </JourneyNavLink>
      ) : (
        <span className={clsx(styles["journey-nav__link"], styles["journey-nav__link--disabled"])}>
          {nextIcon}
        </span>
      )}
    </div>
  );
};

const OtpStats = ({
  stops,
  matchType,
  timingPointsOnly,
  loading,
}: {
  stops: VehicleJourneyStop[];
  matchType: MatchType;
  timingPointsOnly: boolean;
  loading: boolean;
}) => {
  const stats = calculateOtpStats(stops, matchType, timingPointsOnly);
  const incompleteTooltip = (
    <>
      <p>
        {stats.noData.toLocaleString("en-GB")} of{" "}
        {stats.total.toLocaleString("en-GB")} stop departures have limited or
        missing real-time data so we are unable to calculate an accurate on-time
        performance figure.
      </p>
      {stats.incomplete.length > 0 ? (
        <>
          <p>Of these, there are:</p>
          <ul className={tooltipListStyles.tooltipList}>
            {stats.incomplete.map((item) => (
              <li key={item.reason}>
                <strong>{item.count.toLocaleString("en-GB")}</strong> stop
                {item.count > 1 ? "s" : ""} with {item.reason}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );

  return (
    <div className={styles["vehicle-journeys__otp-stats"]}>
      <Stat
        id="vehicle-journeys-on-time"
        className={styles["vehicle-journeys__otp-stat"]}
        label="On-time"
        value={formatPercent(stats.onTime, stats.completed)}
        loading={loading}
        tooltip={`${stats.onTime} of ${stats.completed} recorded stop departures were between 1 minute early and 5 minutes 59 seconds late.`}
      />
      <Stat
        id="vehicle-journeys-late"
        className={styles["vehicle-journeys__otp-stat"]}
        label="Late"
        value={formatPercent(stats.late, stats.completed)}
        loading={loading}
        tooltip={`${stats.late} of ${stats.completed} recorded stop departures were more than 5 minutes 59 seconds late.`}
      />
      <Stat
        id="vehicle-journeys-early"
        className={styles["vehicle-journeys__otp-stat"]}
        label="Early"
        value={formatPercent(stats.early, stats.completed)}
        loading={loading}
        tooltip={`${stats.early} of ${stats.completed} recorded stop departures were more than 1 minute early.`}
      />
      <Stat
        id="vehicle-journeys-incomplete"
        className={styles["vehicle-journeys__otp-stat"]}
        label="Incomplete data"
        value={formatPercent(stats.noData, stats.total)}
        loading={loading}
        tooltip={incompleteTooltip}
      />
    </div>
  );
};

const StopTime = ({
  dateTime,
  includeSeconds,
}: {
  dateTime?: string | null;
  includeSeconds: boolean;
}) => {
  const formatted = formatStopTime(dateTime, includeSeconds);
  if (!includeSeconds || formatted === "-" || formatted.length < 8) {
    return <span className={styles["stop-list-item__scheduled"]}>{formatted}</span>;
  }

  const [hoursMinutes, seconds] = [formatted.slice(0, 5), formatted.slice(5)];

  return (
    <span className={styles["stop-list-item__time-container"]}>
      <span className={styles["stop-list-item__scheduled"]}>{hoursMinutes}</span>
      <span className={styles["stop-list-item__time-container--seconds"]}>{seconds}</span>
    </span>
  );
};

const StopList = ({
  stops,
  matchType,
  timingPointsOnly,
  loading,
  onStopSelect,
  onStopHover,
}: {
  stops: VehicleJourneyStop[];
  matchType: MatchType;
  timingPointsOnly: boolean;
  loading: boolean;
  onStopSelect: (stop: VehicleJourneyStop) => void;
  onStopHover: (stop: VehicleJourneyStop | null) => void;
}) => {
  const visibleStops = stops;
  const includeSeconds = !timingPointsOnly;

  return (
    <div
      className={styles["vehicle-journeys__stop-list"]}
      aria-label="Scheduled and actual stops"
    >
      <div className={clsx(styles["stop-list-item"], styles["stop-list-header"])}>
        <div></div>
        <div></div>
        <div className={styles["stop-list-item__heading"]}>Scheduled</div>
        <div className={styles["stop-list-item__heading"]}>Actual</div>
      </div>
      {loading ? (
        <div className={styles["vehicle-journeys__stop-list-loading"]} aria-live="polite">
          <Spinner size="x-small" />
          <span className="govuk-visually-hidden">Loading stops</span>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={clsx(styles["stop-list-item"], styles["stop-list-item--skeleton"])}
              aria-hidden="true"
            >
              <div className={styles["stop-list-item__skeleton-block"]} />
              <div className={clsx(styles["stop-list-item__skeleton-block"], styles["stop-list-item__skeleton-block--wide"])} />
              <div className={styles["stop-list-item__skeleton-block"]} />
              <div className={styles["stop-list-item__skeleton-block"]} />
            </div>
          ))}
        </div>
      ) : null}
      {!loading && visibleStops.length === 0 ? (
        <p className="govuk-body">No stops available</p>
      ) : null}
      {!loading
        ? visibleStops.map((stop, index) => {
            const actualDeparture = getActualDeparture(stop, matchType);
            const otp = getStopOtp(stop, matchType);
            const displayTimingDetails =
              !timingPointsOnly || stop.isTimingPoint;
            const incompleteReason = stop.setDown
              ? "unmatched set down stop - not included in OTP calculations"
              : incompleteIdToString(stop.incompleteReason);

            const stopIcon = displayTimingDetails ? (
              <span
                className={clsx(
                  styles["stop-list-item__icon"],
                  styles[
                    `stop-list-item__icon--${
                      otp === "OnTime"
                        ? "on-time"
                        : otp === "Early"
                          ? "early"
                          : otp === "Late"
                            ? "late"
                            : "no-data"
                    }`
                  ],
                  !stop.isTimingPoint && styles["stop-list-item__icon--stop"],
                )}
              >
                {stop.isTimingPoint ? <TimingIcon /> : <StopIcon />}
                <span className="govuk-visually-hidden">
                  {stop.isTimingPoint ? "Timing point" : "Stop"}
                </span>
              </span>
            ) : null;

            return (
              <div
                key={`${stop.stopId}-${stop.stopIndex}`}
                className={clsx(
                  styles["stop-list-item"],
                  stop.isTimingPoint && styles["stop-list-item--timing-point"],
                  stop.isTimingPoint &&
                    index === 0 &&
                    styles["stop-list-item--timing-point--first"],
                )}
              >
                <div className={styles["stop-list-item__value-container"]}>
                  {stop.isTimingPoint && stopIcon ? (
                    <Tooltip message="Timing point">{stopIcon}</Tooltip>
                  ) : (
                    stopIcon
                  )}
                </div>
                <div className={styles["stop-list-item__value-container"]}>
                  <button
                    type="button"
                    className={clsx(styles["stop-list-item__name"], "unbuttoned")}
                    onClick={() => onStopSelect(stop)}
                    onMouseEnter={() => onStopHover(stop)}
                    onMouseLeave={() => onStopHover(null)}
                    onFocus={() => onStopHover(stop)}
                    onBlur={() => onStopHover(null)}
                  >
                    <span>{stop.stopName || "-"}</span>
                  </button>
                </div>
                <div className={clsx(styles["stop-list-item__value-container"], styles["stop-list-item__value-container__align-right"])}>
                  {displayTimingDetails ? (
                    <StopTime
                      dateTime={stop.scheduledDepartureUtc}
                      includeSeconds={includeSeconds}
                    />
                  ) : null}
                </div>
                <div className={clsx(styles["stop-list-item__value-container"], styles["stop-list-item__value-container__align-right"])}>
                  {displayTimingDetails ? (
                    actualDeparture ? (
                      <Tooltip
                        message={`Calculated delay ${formatDelay(stop.scheduledDepartureUtc, actualDeparture)}`}
                      >
                        <span className={styles["stop-list-item__actual"]}>
                          <StopTime
                            dateTime={actualDeparture}
                            includeSeconds={includeSeconds}
                          />
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip
                        message={`Incomplete Reason: ${incompleteReason}`}
                      >
                        <span>—</span>
                      </Tooltip>
                    )
                  ) : null}
                </div>
              </div>
            );
          })
        : null}
    </div>
  );
};

export const VehicleJourneyDetail = ({
  router,
  journeyId,
  dateOfJourney,
  operatorId,
  serviceId,
  directionRef,
  journeyInfo,
  journeyInfoLoading,
  journeys,
  journeysLoading,
  currentJourney,
  currentJourneyIndex,
  vehicles,
  vehicleRef,
  onVehicleRefChange,
  avls,
  rawAvls,
  routeGeometry,
  viewportKey,
}: VehicleJourneyDetailProps) => {
  const [selectedStop, setSelectedStop] = useState<VehicleJourneyStop | null>(
    null,
  );
  const [hoveredStop, setHoveredStop] = useState<VehicleJourneyStop | null>(
    null,
  );
  const matchType =
    router.query.match_type === MatchType.Estimated
      ? MatchType.Estimated
      : MatchType.Evidenced;
  const stopType =
    router.query.allStops === "true"
      ? StopTypeOption.AllStops
      : StopTypeOption.TimingPoints;
  const timingPointsOnly = stopType === StopTypeOption.TimingPoints;
  const showLoadingState =
    (journeysLoading || journeyInfoLoading) && !currentJourney;
  const heading = showLoadingState
    ? "Loading journey details"
    : currentJourney
      ? `${currentJourney.serviceNumber}: ${currentJourney.serviceName}`
      : "Journey not found";
  const showNotFound =
    !journeysLoading && !journeyInfoLoading && journeyInfo === null;

  return (
    <div className={styles["vehicle-journeys__detail"]}>
      <span className="govuk-caption-xl">Vehicle journeys</span>
      <h1 className="govuk-heading-xl">{heading}</h1>

      {showLoadingState ? (
        <div className="govuk-body" aria-live="polite">
          <Spinner size="small" />
          <span className="govuk-visually-hidden">Loading journey details</span>
        </div>
      ) : null}

      {showNotFound ? (
        <p className="govuk-body">
          Vehicle journey not found, or you do not have permission to view. Go
          back to{" "}
          <Link
            className="govuk-link"
            href={getVehicleJourneyReturnHref(
              dateOfJourney,
              operatorId,
              serviceId,
            )}
          >
            Vehicle journeys
          </Link>
          ?
        </p>
      ) : null}

      {vehicles.length > 1 ? (
        <div className="govuk-error-summary" data-module="govuk-error-summary">
          <div role="alert">
            <h2 className="govuk-error-summary__title">
              Data from multiple vehicles found for the selected start time
              (journey code)
            </h2>
            <div className="govuk-error-summary__body">
              <p>
                This data quality issue is likely to have resulted in poor
                quality performance data for the journey
              </p>
              <p>
                Location data for the different vehicles can be viewed on the
                map. This will not change performance data.
              </p>
              {vehicleRef ? (
                <SegmentedToggle
                  legend="Vehicle"
                  name="vehicle-ref"
                  value={vehicleRef}
                  onChange={onVehicleRefChange}
                  options={vehicles.map((vehicle) => ({
                    value: vehicle,
                    label: vehicle,
                  }))}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {currentJourney?.isCancelled ? (
        <div className="govuk-error-summary" data-module="govuk-error-summary">
          <div role="alert">
            <h2 className="govuk-error-summary__title">Journey Cancelled</h2>
            <div className="govuk-error-summary__body">
              <p>
                This journey has been cancelled (per SIRI-SX data) and will
                therefore not be included in on-time performance statistics.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!showNotFound ? (
        <>
          <div className={styles["vehicle-journeys__header-container"]}>
            <JourneySummaryList
              journey={currentJourney}
              vehicleRef={vehicleRef}
              distance={routeGeometry?.distance}
            />
            <div className={styles["vehicle-journeys__controls"]}>
              <SegmentedToggle
                legend="Show performance using"
                hideLegend
                name="match-type"
                value={matchType}
                onChange={(value) =>
                  replaceQuery(router, { match_type: value })
                }
                options={[
                  { value: MatchType.Estimated, label: "Estimated" },
                  { value: MatchType.Evidenced, label: "Evidenced" },
                ]}
              />
              <SegmentedToggle
                legend="Show stops"
                hideLegend
                name="stop-type"
                value={stopType}
                onChange={(value) =>
                  replaceQuery(router, {
                    allStops: value === StopTypeOption.AllStops ? "true" : null,
                  })
                }
                options={[
                  { value: StopTypeOption.AllStops, label: "All stops" },
                  {
                    value: StopTypeOption.TimingPoints,
                    label: "Timing points",
                  },
                ]}
              />
              {Array.isArray(journeys) ? (
                <JourneyNav
                  journeys={journeys}
                  currentJourneyIndex={currentJourneyIndex}
                  dateOfJourney={dateOfJourney}
                  operatorId={operatorId}
                  serviceId={serviceId}
                  matchType={matchType}
                  stopType={stopType}
                />
              ) : journeysLoading ? (
                <div className={styles["vehicle-journeys__nav-loading"]}>
                  <Spinner size="x-small" />
                  <span className="govuk-visually-hidden">
                    Loading journeys
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles["vehicle-journeys__stop-map-grid"]}>
            <StopList
              stops={journeyInfo?.stops ?? []}
              matchType={matchType}
              timingPointsOnly={timingPointsOnly}
              loading={journeyInfoLoading}
              onStopSelect={setSelectedStop}
              onStopHover={setHoveredStop}
            />
            <div className={styles["vehicle-journeys__sticky-container"]}>
              <OtpStats
                stops={journeyInfo?.stops ?? []}
                matchType={matchType}
                timingPointsOnly={timingPointsOnly}
                loading={journeyInfoLoading}
              />
              <VehicleJourneyMap
                stops={journeyInfo?.stops ?? []}
                avls={avls}
                rawAvls={rawAvls}
                scheduledRoute={routeGeometry?.geom ?? null}
                directionRef={directionRef}
                matchType={matchType}
                viewportKey={viewportKey}
                loading={journeyInfoLoading}
                selectedStop={selectedStop}
                hoveredStop={hoveredStop}
              />
            </div>
          </div>
        </>
      ) : null}

      <span className="govuk-visually-hidden">Journey id {journeyId}</span>
    </div>
  );
};
