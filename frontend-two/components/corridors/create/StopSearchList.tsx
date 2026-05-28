import { useMemo, useState } from "react";
import { CorridorStop } from "@/types/corridors";

const LIST_LEN = 100;

interface Props {
  matchingStops: CorridorStop[];
  isFirstStop: boolean;
  onAddStop: (stop: CorridorStop) => void;
}

export const StopSearchList = ({
  matchingStops,
  isFirstStop,
  onAddStop,
}: Props) => {
  const [listSize, setListSize] = useState(LIST_LEN);

  const stops = useMemo(
    () => matchingStops.slice(0, listSize),
    [matchingStops, listSize],
  );

  const showMoreBtn = matchingStops.length > listSize;

  return (
    <>
      {stops.map((stop, index) => (
        <div
          key={`${stop.stopId}-${index}`}
          className="govuk-!-margin-bottom-3 govuk-!-padding-bottom-2"
        >
          <div className="govuk-body govuk-!-margin-bottom-1">
            <strong>{stop.stopName}</strong>
          </div>
          <div className="govuk-body-s govuk-!-margin-bottom-2">
            {stop.localityName ? `${stop.localityName} ` : ""}
            {stop.naptan}
          </div>
          <button
            type="button"
            className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
            data-module="govuk-button"
            onClick={() => onAddStop(stop)}
          >
            {isFirstStop ? "Select" : "Add"}
          </button>
          <hr className="govuk-section-break govuk-section-break--visible" />
        </div>
      ))}

      {showMoreBtn ? (
        <button
          type="button"
          className="govuk-button govuk-button--secondary"
          data-module="govuk-button"
          onClick={() => setListSize((current) => current + LIST_LEN)}
        >
          Show more
        </button>
      ) : null}
    </>
  );
};
