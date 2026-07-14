import Link from "next/link";
import { NextRouter } from "next/router";
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";
import { Stat } from "@/components/shared/SummaryStat/Stat";
import { Tooltip } from "@/components/shared/Tooltip";
import { TimingIcon } from "@/components/icons/TimingIcon";
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

const getReturnHref = (
  dateOfJourney: string | null,
  operatorId: string | null,
  serviceId: string | null,
) => ({
  pathname: "/vehicle-journeys",
  query: {
    ...(dateOfJourney ? { date: dateOfJourney } : {}),
    ...(operatorId ? { operator: operatorId } : {}),
    ...(serviceId ? { service: serviceId } : {}),
  },
});

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
  <dl className="govuk-summary-list vehicle-journeys__summary-list">
    <div className="govuk-summary-list__row">
      <dt className="govuk-summary-list__key">Operator</dt>
      <dd className="govuk-summary-list__value">
        {journey ? `${journey.operatorName} (${journey.operatorNoc})` : "Unknown"}
      </dd>
    </div>
    <div className="govuk-summary-list__row">
      <dt className="govuk-summary-list__key">Service pattern</dt>
      <dd className="govuk-summary-list__value">{journey?.serviceName ?? "Unknown"}</dd>
    </div>
    <div className="govuk-summary-list__row">
      <dt className="govuk-summary-list__key">Scheduled start time</dt>
      <dd className="govuk-summary-list__value">
        {journey ? formatLongDateTime(journey.startTime) : "Unknown"}
      </dd>
    </div>
    <div className="govuk-summary-list__row">
      <dt className="govuk-summary-list__key">Vehicle ID</dt>
      <dd className="govuk-summary-list__value">{vehicleRef ?? "Unknown"}</dd>
    </div>
    <div className="govuk-summary-list__row">
      <dt className="govuk-summary-list__key">Scheduled distance (km)</dt>
      <dd className="govuk-summary-list__value">
        {typeof distance === "number" ? (distance / 1000).toString() : "Unknown"}
      </dd>
    </div>
  </dl>
);

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
  const previous = currentJourneyIndex > 0 ? journeys[currentJourneyIndex - 1] : null;
  const next =
    currentJourneyIndex >= 0 && currentJourneyIndex < journeys.length - 1
      ? journeys[currentJourneyIndex + 1]
      : null;

  return (
    <div className="journey-nav">
      <span>Journey</span>
      {previous ? (
        <Link
          className="journey-nav__link"
          title={`${previous.serviceNumber}: ${previous.serviceName}`}
          href={getJourneyHref(previous, dateOfJourney, operatorId, serviceId, matchType, stopType)}
        >
          <span aria-hidden="true">‹</span>
          <span>{formatJourneyStartTime(previous)}</span>
        </Link>
      ) : (
        <span className="journey-nav__link journey-nav__link--disabled">‹</span>
      )}
      {next ? (
        <Link
          className="journey-nav__link"
          title={`${next.serviceNumber}: ${next.serviceName}`}
          href={getJourneyHref(next, dateOfJourney, operatorId, serviceId, matchType, stopType)}
        >
          <span>{formatJourneyStartTime(next)}</span>
          <span aria-hidden="true">›</span>
        </Link>
      ) : (
        <span className="journey-nav__link journey-nav__link--disabled">›</span>
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
  const incompleteTooltip = `${stats.noData.toLocaleString("en-GB")} of ${stats.total.toLocaleString("en-GB")} stop departures have limited or missing real-time data so we are unable to calculate an accurate on-time performance figure.${
    stats.incomplete.length > 0
      ? ` Of these, there are: ${stats.incomplete
          .map((item) => `${item.count} stop${item.count > 1 ? "s" : ""} with ${item.reason}`)
          .join(", ")}.`
      : ""
  }`;

  return (
    <div className="vehicle-journeys__otp-stats">
      <Stat
        id="vehicle-journeys-on-time"
        className="vehicle-journeys__otp-stat"
        label="On-time"
        value={formatPercent(stats.onTime, stats.completed)}
        loading={loading}
        tooltip={`${stats.onTime} of ${stats.completed} recorded stop departures were between 1 minute early and 5 minutes 59 seconds late.`}
      />
      <Stat
        id="vehicle-journeys-late"
        className="vehicle-journeys__otp-stat"
        label="Late"
        value={formatPercent(stats.late, stats.completed)}
        loading={loading}
        tooltip={`${stats.late} of ${stats.completed} recorded stop departures were more than 5 minutes 59 seconds late.`}
      />
      <Stat
        id="vehicle-journeys-early"
        className="vehicle-journeys__otp-stat"
        label="Early"
        value={formatPercent(stats.early, stats.completed)}
        loading={loading}
        tooltip={`${stats.early} of ${stats.completed} recorded stop departures were more than 1 minute early.`}
      />
      <Stat
        id="vehicle-journeys-incomplete"
        className="vehicle-journeys__otp-stat"
        label="Incomplete data"
        value={formatPercent(stats.noData, stats.total)}
        loading={loading}
        tooltip={incompleteTooltip}
      />
    </div>
  );
};

const StopList = ({
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
  const visibleStops = stops.filter((stop) => stop.isTimingPoint || !timingPointsOnly);
  const includeSeconds = !timingPointsOnly;

  return (
    <div className="vehicle-journeys__stop-list" aria-label="Scheduled and actual stops">
      <div className="stop-list-item stop-list-header">
        <div></div>
        <div></div>
        <div className="stop-list-item__heading">Scheduled</div>
        <div className="stop-list-item__heading">Actual</div>
      </div>
      {loading ? <p className="govuk-body">Loading...</p> : null}
      {!loading && visibleStops.length === 0 ? (
        <p className="govuk-body">No stops available</p>
      ) : null}
      {visibleStops.map((stop, index) => {
        const actualDeparture = getActualDeparture(stop, matchType);
        const otp = getStopOtp(stop, matchType);
        const incompleteReason = stop.setDown
          ? "unmatched set down stop - not included in OTP calculations"
          : incompleteIdToString(stop.incompleteReason);

        return (
          <div
            key={`${stop.stopId}-${stop.stopIndex}`}
            className={`stop-list-item${stop.isTimingPoint ? " stop-list-item--timing-point" : ""}${
              stop.isTimingPoint && index === 0 ? " stop-list-item--timing-point--first" : ""
            }`}
          >
            <div className="stop-list-item__value-container">
              <Tooltip message={stop.isTimingPoint ? "Timing point" : "Stop"}>
                <span
                  className={`stop-list-item__icon stop-list-item__icon--${
                    otp === "OnTime" ? "on-time" : otp === "Early" ? "early" : otp === "Late" ? "late" : "no-data"
                  }${stop.isTimingPoint ? "" : " stop-list-item__icon--stop"}`}
                >
                  {stop.isTimingPoint ? <TimingIcon /> : <span aria-hidden="true">•</span>}
                  <span className="govuk-visually-hidden">
                    {stop.isTimingPoint ? "Timing point" : "Stop"}
                  </span>
                </span>
              </Tooltip>
            </div>
            <div className="stop-list-item__value-container">
              <button type="button" className="stop-list-item__name unbuttoned">
                <span>{stop.stopName || "-"}</span>
              </button>
            </div>
            <div className="stop-list-item__value-container stop-list-item__value-container__align-right">
              {formatStopTime(stop.scheduledDepartureUtc, includeSeconds)}
            </div>
            <div className="stop-list-item__value-container stop-list-item__value-container__align-right">
              {actualDeparture ? (
                <Tooltip
                  message={`Calculated delay ${formatDelay(stop.scheduledDepartureUtc, actualDeparture)}`}
                >
                  <span>{formatStopTime(actualDeparture, includeSeconds)}</span>
                </Tooltip>
              ) : (
                <Tooltip message={`Incomplete Reason: ${incompleteReason}`}>
                  <span>—</span>
                </Tooltip>
              )}
            </div>
          </div>
        );
      })}
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
}: VehicleJourneyDetailProps) => {
  const matchType =
    router.query.match_type === MatchType.Estimated ? MatchType.Estimated : MatchType.Evidenced;
  const stopType =
    router.query.allStops === "true" ? StopTypeOption.AllStops : StopTypeOption.TimingPoints;
  const timingPointsOnly = stopType === StopTypeOption.TimingPoints;
  const heading = currentJourney
    ? `${currentJourney.serviceNumber}: ${currentJourney.serviceName}`
    : "Journey not found";
  const showNotFound = !journeyInfoLoading && journeyInfo === null;

  return (
    <>
      <Link
        className="govuk-back-link"
        href={getReturnHref(dateOfJourney, operatorId, serviceId)}
      >
        Search
      </Link>
      <span className="govuk-caption-xl">Vehicle journeys</span>
      <h1 className="govuk-heading-xl">{heading}</h1>

      {showNotFound ? (
        <p className="govuk-body">
          Vehicle journey not found, or you do not have permission to view. Go back to{" "}
          <Link className="govuk-link" href={getReturnHref(dateOfJourney, operatorId, serviceId)}>
            Vehicle journeys
          </Link>
          ?
        </p>
      ) : null}

      {vehicles.length > 1 ? (
        <div className="govuk-error-summary" data-module="govuk-error-summary">
          <div role="alert">
            <h2 className="govuk-error-summary__title">
              Data from multiple vehicles found for the selected start time (journey code)
            </h2>
            <div className="govuk-error-summary__body">
              <p>
                This data quality issue is likely to have resulted in poor quality performance data for the journey
              </p>
              <p>
                Location data for the different vehicles can be viewed on the map. This will not change performance data.
              </p>
              {vehicleRef ? (
                <SegmentedToggle
                  legend="Vehicle"
                  name="vehicle-ref"
                  value={vehicleRef}
                  onChange={onVehicleRefChange}
                  options={vehicles.map((vehicle) => ({ value: vehicle, label: vehicle }))}
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
                This journey has been cancelled (per SIRI-SX data) and will therefore not be included in on-time performance statistics.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!showNotFound ? (
        <>
          <div className="vehicle-journeys__header-container">
            <JourneySummaryList
              journey={currentJourney}
              vehicleRef={vehicleRef}
              distance={routeGeometry?.distance}
            />
            <div className="vehicle-journeys__controls">
              <SegmentedToggle
                legend="Show performance using"
                name="match-type"
                value={matchType}
                onChange={(value) => replaceQuery(router, { match_type: value })}
                options={[
                  { value: MatchType.Evidenced, label: "Evidenced" },
                  { value: MatchType.Estimated, label: "Estimated" },
                ]}
              />
              <SegmentedToggle
                legend="Show stops"
                name="stop-type"
                value={stopType}
                onChange={(value) =>
                  replaceQuery(router, {
                    allStops: value === StopTypeOption.AllStops ? "true" : null,
                  })
                }
                options={[
                  { value: StopTypeOption.TimingPoints, label: "Timing points" },
                  { value: StopTypeOption.AllStops, label: "All stops" },
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
                <p className="govuk-body">Loading journeys...</p>
              ) : null}
            </div>
          </div>

          <div className="vehicle-journeys__stop-map-grid">
            <StopList
              stops={journeyInfo?.stops ?? []}
              matchType={matchType}
              timingPointsOnly={timingPointsOnly}
              loading={journeyInfoLoading}
            />
            <div className="vehicle-journeys__sticky-container">
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
              />
            </div>
          </div>
        </>
      ) : null}

      <span className="govuk-visually-hidden">Journey id {journeyId}</span>
    </>
  );
};
