import { CorridorStop } from "@/types/corridors";
import { ServiceLinkType } from "../../../src/generated/graphql";
import { isInvalidRouteLink } from "@/services/corridors/corridors-speed-utils";

const METERS_PER_MILE = 1609.344;

interface Props {
  stops: CorridorStop[];
  serviceLinks?: ServiceLinkType[];
  selectedSegmentIndex: number | null;
  onChangeSegmentIndex: (value: number | null) => void;
  isDisabled?: boolean;
}

export const CorridorSegmentSelector = ({
  stops,
  serviceLinks,
  selectedSegmentIndex,
  onChangeSegmentIndex,
  isDisabled = false,
}: Props) => {
  if (stops.length < 2) return null;

  const segments = Array.from({ length: stops.length - 1 }, (_, index) => ({
    index,
    from: stops[index],
    to: stops[index + 1],
  }));

  const isInvalidServiceLink = (
    fromNaptan: string,
    toNaptan: string,
  ): boolean => {
    if (!serviceLinks?.length) return false;
    const link = serviceLinks.find(
      (l) => l.fromStop === fromNaptan && l.toStop === toNaptan,
    );
    return link ? isInvalidRouteLink(link) : false;
  };

  const containsInvalidServiceLink = segments.some((seg) =>
    isInvalidServiceLink(seg.from.naptan, seg.to.naptan),
  );

  const getSegmentDistance = (
    fromNaptan: string,
    toNaptan: string,
  ): string | null => {
    if (!serviceLinks?.length) return null;
    const link = serviceLinks.find(
      (l) => l.fromStop === fromNaptan && l.toStop === toNaptan,
    );
    if (!link) return null;
    const miles = link.distance / METERS_PER_MILE;
    return `${miles.toFixed(1)}mi`;
  };

  return (
    <>
      <div className="segment-selector-wrapper govuk-!-margin-bottom-6">
        <div className="segment-selector">
          {/* All segments button — top half of the rail */}
          <button
            type="button"
            className={`unbuttoned segment-selector__segment segment-selector__segment--all${
              selectedSegmentIndex === null
                ? " segment-selector__segment--active"
                : ""
            }`}
            onClick={() => onChangeSegmentIndex(null)}
            disabled={isDisabled}
          >
            <span className="govuk-visually-hidden">All segments</span>
          </button>

          {/* Individual segments — bottom half of the rail */}
          <div className="segment-selector__segments-wrapper">
            {segments.map((seg) => (
              <button
                key={seg.index}
                type="button"
                className={`unbuttoned segment-selector__segment${
                  isInvalidServiceLink(seg.from.naptan, seg.to.naptan)
                    ? selectedSegmentIndex === seg.index
                      ? " segment-selector__segment__invalid-service-link segment-selector__segment__invalid-service-link--active"
                      : " segment-selector__segment__invalid-service-link"
                    : selectedSegmentIndex === seg.index
                      ? " segment-selector__segment--active"
                      : ""
                }`}
                onClick={() => onChangeSegmentIndex(seg.index)}
                disabled={isDisabled}
              >
                <span className="govuk-visually-hidden">
                  Segment - {seg.from.stopName}, {seg.to.stopName}
                </span>
              </button>
            ))}
          </div>

          {/* Distance labels */}
          <div className="segment-selector__distances-wrapper">
            {segments.map((seg) => {
              const distance = getSegmentDistance(
                seg.from.naptan,
                seg.to.naptan,
              );
              const invalid = isInvalidServiceLink(
                seg.from.naptan,
                seg.to.naptan,
              );
              return (
                <div key={seg.index} className="segment-selector__distance">
                  {distance && <span>{distance}</span>}
                  {invalid && <span>*</span>}
                </div>
              );
            })}
          </div>

          {/* Stop circles — rendered last so they layer on top via z-index */}
          <div
            className="segment-selector__stops-wrapper"
            role="list"
            aria-label="Corridor stops"
          >
            {stops.map((stop) => (
              <div
                key={stop.naptan}
                className="segment-selector__stop"
                role="listitem"
                aria-label={`Stop - ${stop.stopName} (NaPTAN code: ${stop.naptan})`}
                title={stop.stopName}
              />
            ))}
          </div>
        </div>
      </div>

      {containsInvalidServiceLink && (
        <div className="segment-selector-hint">
          <span className="segment-selector-hint__text">
            * Dashed line indicates speed and distance are based on
            straight-line measurement
          </span>
        </div>
      )}
    </>
  );
};
