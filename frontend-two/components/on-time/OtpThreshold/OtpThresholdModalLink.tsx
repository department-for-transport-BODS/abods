import { clsx } from "clsx";
import styles from "./otp-threshold-modal-link.module.scss";
import { useState } from "react";
import { OtpThresholdModal } from "@/components/on-time/OtpThreshold/OtpThresholdModal";
import { Tooltip } from "@/components/shared/Tooltip";
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
      <Tooltip
        message="Compare on-time performance thresholds"
        className={clsx(
          "govuk-body",
          "govuk-link",
          "button-link",
          styles.otpThresholdModalButton,
        )}
        onClick={() => setOpen(true)}
      >
        Compare thresholds
      </Tooltip>
      <OtpThresholdModal
        open={open}
        onClose={() => setOpen(false)}
        params={params}
        defaultValues={overview}
      />
    </>
  );
};
