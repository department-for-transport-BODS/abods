import { useMemo, useState } from "react";
import { CorridorStop } from "@/types/corridors";

const LIST_LEN = 100;

interface Props {
  matchingStops: CorridorStop[];
  isFirstStop: boolean;
  onAddStop: (stop: CorridorStop) => void;
  showGraphic?: boolean;
}

export const StopSearchList = ({
  matchingStops,
  isFirstStop,
  onAddStop,
  showGraphic = false,
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
          className="corridor-stop-list__stop corridor-stop-list__stop--matching"
        >
          <div className={`corridor-stop-list__stop-details ${!showGraphic ? "corridor-stop-list__stop-details--no-graphic" : ""}`}>
            <div className="corridor-stop-list__stop-label">{stop.stopName}</div>
            <div className="corridor-stop-list__naptan">
              {stop.localityName ? `${stop.localityName} ` : ""}
              {stop.naptan}
            </div>
          </div>
          <button
            type="button"
            className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
            data-module="govuk-button"
            onClick={() => onAddStop(stop)}
          >
            {isFirstStop ? "Select" : "Add"}
          </button>
        </div>
      ))}

      {showMoreBtn ? (
        <button
          type="button"
          className="govuk-button govuk-button--secondary govuk-!-margin-top-4"
          data-module="govuk-button"
          onClick={() => setListSize((current) => current + LIST_LEN)}
        >
          Show more
        </button>
      ) : null}
    </>
  );
};
