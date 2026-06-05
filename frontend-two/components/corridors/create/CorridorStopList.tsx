import { CorridorStop } from "@/types/corridors";

interface Props {
  corridorStops: CorridorStop[];
  loading: boolean;
  isEdit: boolean;
  onRemoveLastStop: () => void;
}

export const CorridorStopList = ({
  corridorStops,
  loading,
  isEdit,
  onRemoveLastStop,
}: Props) => {
  if (!corridorStops.length) return null;

  return (
    <div className="corridor-stop-list">
      {corridorStops.map((stop, index) => {
        const isLast = index === corridorStops.length - 1;
        const canRemove = isLast && !loading && (isEdit ? index > 0 : true);

        return (
          <div
            key={`${stop.stopId}-${index}`}
            className={`corridor-stop-list__stop corridor-stop-list__stop--added${
              isLast ? "" : " corridor-stop-list__stop--connected"
            }`}
          >
            <div className="corridor-stop-list__stop-details">
              <div className="corridor-stop-list__stop-label">
                {stop.stopName}
              </div>
              <div className="corridor-stop-list__naptan">{stop.naptan}</div>
            </div>
            {canRemove ? (
              <button
                type="button"
                className="govuk-link button-link"
                onClick={onRemoveLastStop}
              >
                Remove
              </button>
            ) : null}
            {!isLast ? (
              <hr className="govuk-section-break govuk-section-break--visible" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
