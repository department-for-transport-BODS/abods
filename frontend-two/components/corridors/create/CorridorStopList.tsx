import { clsx } from "clsx";
import styles from "./corridor-stop-list.module.scss";
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
    <div className={styles.corridorStopList}>
      {corridorStops.map((stop, index) => {
        const isLast = index === corridorStops.length - 1;
        const canRemove = isLast && !loading && (isEdit ? index > 0 : true);

        return (
          <div
            key={`${stop.stopId}-${index}`}
            className={clsx(
              styles.stop,
              styles.stopAdded,
              !isLast && styles.stopConnected,
            )}
          >
            <div className={styles.stopDetails}>
              <div className={styles.stopLabel}>{stop.stopName}</div>
              <div className={styles.naptan}>{stop.naptan}</div>
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
