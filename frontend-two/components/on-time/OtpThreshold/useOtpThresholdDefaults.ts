import { useCallback } from "react";
import { useConfig } from "@/contexts/ConfigContext";
import {
  OTP_THRESHOLD_FALLBACK,
  OtpThreshold,
  getOtpThresholdDefault,
  resetOtpThresholdDefaults,
  setOtpThresholdDefault,
} from "@/components/on-time/OtpThreshold/otpThresholdDefaults";

interface OtpThresholdDefaults {
  /** Current default "early" threshold in minutes. */
  early: number;
  /** Current default "late" threshold in minutes. */
  late: number;
  /** Persist a threshold value. */
  setDefault: (threshold: OtpThreshold, value: number) => void;
  /** Clear any persisted thresholds. */
  reset: () => void;
}

/**
 * Resolves the OTP comparison threshold defaults, layering:
 *   localStorage -> config.otp -> hard-coded fallback.
 */
export const useOtpThresholdDefaults = (): OtpThresholdDefaults => {
  const { config } = useConfig();

  // config.otp may be disabled (falsy) in some environments.
  const configOtp = config?.otp as
    | { early?: number; late?: number }
    | undefined;

  const fallbackEarly = configOtp?.early ?? OTP_THRESHOLD_FALLBACK.early;
  const fallbackLate = configOtp?.late ?? OTP_THRESHOLD_FALLBACK.late;

  const setDefault = useCallback((threshold: OtpThreshold, value: number) => {
    setOtpThresholdDefault(threshold, value);
  }, []);

  const reset = useCallback(() => {
    resetOtpThresholdDefaults();
  }, []);

  return {
    early: getOtpThresholdDefault("early", fallbackEarly),
    late: getOtpThresholdDefault("late", fallbackLate),
    setDefault,
    reset,
  };
};
