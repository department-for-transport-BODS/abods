import { useState } from "react";
import { OtpThresholdModal } from "@/components/on-time/otp-threshold/OtpThresholdModal";
import {
  PerformanceParams,
  PunctualityOverview,
} from "@/services/on-time/on-time.service";

interface OtpThresholdModalLinkProps {
  /** Current on-time query params passed through to the comparison query. */
  params: PerformanceParams | null;
  /** Current punctuality overview used for the modal's "Default" column. */
  overview?: PunctualityOverview | null;
}

/**
 * "Compare thresholds" link that opens the OTP threshold comparison modal.
 * Mirrors the Angular otp-threshold-modal-link.
 */
export const OtpThresholdModalLink = ({
  params,
  overview,
}: OtpThresholdModalLinkProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="govuk-body govuk-link button-link"
        onClick={() => setOpen(true)}
      >
        Compare thresholds
      </button>
      <OtpThresholdModal
        open={open}
        onClose={() => setOpen(false)}
        params={params}
        defaultValues={overview}
      />
    </>
  );
};
