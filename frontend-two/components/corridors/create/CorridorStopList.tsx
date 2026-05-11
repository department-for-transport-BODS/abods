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
    <>
      {corridorStops.map((stop, index) => {
        const isLast = index === corridorStops.length - 1;
        const canRemove = isLast && !loading && (isEdit ? index > 0 : true);

        return (
          <div
            key={`${stop.stopId}-${index}`}
            className="govuk-!-margin-bottom-3 govuk-!-padding-bottom-2"
          >
            <div className="govuk-body govuk-!-margin-bottom-1">
              <strong>{stop.stopName}</strong>
            </div>
            <div className="govuk-body-s govuk-!-margin-bottom-1">
              {stop.naptan}
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
    </>
  );
};
