import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import {
  OtpThresholdForm,
  OtpThresholds,
} from "@/components/on-time/OtpThreshold/OtpThresholdForm";
import {
  PerformanceParams,
  PunctualityOverview,
  onTimeService,
} from "@/services/on-time/on-time.service";

interface OtpThresholdModalProps {
  open: boolean;
  onClose: () => void;
  /** Current on-time query params; the comparison re-runs the stats query with these plus custom thresholds. */
  params: PerformanceParams | null;
  /** The current punctuality overview, used to populate the "Default" column. */
  defaultValues?: PunctualityOverview | null;
}

const ratio = (
  value?: number | null,
  completed?: number | null,
): number | null => {
  if (value == null || !completed) return null;
  return value / completed;
};

const formatRatio = (value: number | null, fallback: string): string =>
  value == null ? fallback : `${(value * 100).toFixed(2)}%`;

interface ComparisonRow {
  key: string;
  label: string;
  defaultRatio: number | null;
  comparisonRatio: number | null;
}

/**
 * Modal that lets the user compare on-time performance against an alternative
 * definition of "on-time" (custom early / late minute thresholds).
 * Mirrors the Angular otp-threshold-modal.
 */
export const OtpThresholdModal = ({
  open,
  onClose,
  params,
  defaultValues,
}: OtpThresholdModalProps) => {
  const [comparison, setComparison] = useState<PunctualityOverview | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the comparison whenever the modal is closed.
  useEffect(() => {
    if (!open) {
      setComparison(null);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleCompare = async ({ early, late }: OtpThresholds) => {
    if (!params) return;
    setLoading(true);
    setError(null);
    try {
      const data = await onTimeService.fetchOnTimeStats({
        ...params,
        filters: {
          ...params.filters,
          onTimeMaxMinutes: late,
          onTimeMinMinutes: early * -1,
        },
      });
      setComparison(data);
    } catch {
      setError("There was an issue comparing data, please try again.");
      setComparison(null);
    } finally {
      setLoading(false);
    }
  };

  const rows: ComparisonRow[] = [
    {
      key: "onTime",
      label: "On time",
      defaultRatio: ratio(defaultValues?.onTime, defaultValues?.completed),
      comparisonRatio: ratio(comparison?.onTime, comparison?.completed),
    },
    {
      key: "late",
      label: "Late",
      defaultRatio: ratio(defaultValues?.late, defaultValues?.completed),
      comparisonRatio: ratio(comparison?.late, comparison?.completed),
    },
    {
      key: "early",
      label: "Early",
      defaultRatio: ratio(defaultValues?.early, defaultValues?.completed),
      comparisonRatio: ratio(comparison?.early, comparison?.completed),
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compare on-time performance thresholds"
      description="Use an alternative definition of on-time to compare performance data with other platforms."
    >
      {error ? (
        <p className="govuk-error-message">
          <span className="govuk-visually-hidden">Error:</span> {error}
        </p>
      ) : null}

      <OtpThresholdForm onCompare={handleCompare} />

      <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th scope="col" className="govuk-table__header">
              <span className="govuk-visually-hidden">Metric</span>
            </th>
            <th
              scope="col"
              className="govuk-table__header govuk-table__header--numeric"
            >
              Default
            </th>
            <th
              scope="col"
              className="govuk-table__header govuk-table__header--numeric"
            >
              Comparison
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {rows.map((row) => (
            <tr key={row.key} className="govuk-table__row">
              <th scope="row" className="govuk-table__header">
                {row.label}
              </th>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                {formatRatio(row.defaultRatio, "Unavailable")}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                {loading ? (
                  <span className="govuk-visually-hidden">Loading</span>
                ) : (
                  <span className="govuk-!-font-weight-bold">
                    {formatRatio(row.comparisonRatio, "-")}
                  </span>
                )}
                {loading ? <span aria-hidden="true">…</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0 otp-threshold-modal__close-button"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
};
