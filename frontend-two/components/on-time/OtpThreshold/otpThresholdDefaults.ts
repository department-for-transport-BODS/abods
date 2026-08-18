/**
 * OTP threshold defaults
 *
 * Persists the user's chosen "early" / "late" comparison thresholds (in minutes)
 * in localStorage, mirroring the Angular OtpThresholdDefaultsService.
 * Falls back to the values provided by config (config.otp.early / late), and
 * finally to hard-coded defaults if neither is available.
 */

export const OTP_THRESHOLD_STORAGE_KEYS = {
  early: "otpCompareThresholdEarly",
  late: "otpCompareThresholdLate",
} as const;

export type OtpThreshold = keyof typeof OTP_THRESHOLD_STORAGE_KEYS;

/** Used when neither localStorage nor config provide a value. */
export const OTP_THRESHOLD_FALLBACK: Record<OtpThreshold, number> = {
  early: 1,
  late: 6,
};

const readStored = (key: string): number | null => {
  if (typeof window === "undefined") return null;
  const item = window.localStorage.getItem(key);
  if (item === null) return null;
  try {
    const value = JSON.parse(item) as unknown;
    return typeof value === "number" ? value : null;
  } catch {
    return null;
  }
};

/**
 * Read a stored threshold, falling back to the provided default.
 */
export const getOtpThresholdDefault = (
  threshold: OtpThreshold,
  fallback: number,
): number => {
  const stored = readStored(OTP_THRESHOLD_STORAGE_KEYS[threshold]);
  return stored ?? fallback;
};

/**
 * Persist a threshold value.
 */
export const setOtpThresholdDefault = (
  threshold: OtpThreshold,
  value: number,
): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    OTP_THRESHOLD_STORAGE_KEYS[threshold],
    JSON.stringify(value),
  );
};

/**
 * Clear any persisted thresholds.
 */
export const resetOtpThresholdDefaults = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OTP_THRESHOLD_STORAGE_KEYS.early);
  window.localStorage.removeItem(OTP_THRESHOLD_STORAGE_KEYS.late);
};
