import { ChangeEvent } from "react";
import styles from "./OtpThresholdSlider.module.scss";

/** Thresholds are whole minutes between 1 and 20 on each side of the scheduled departure. */
export const OTP_THRESHOLD_MIN = 1;
export const OTP_THRESHOLD_MAX = 20;

// The axis runs from 0 (max early) through OTP_THRESHOLD_MAX (scheduled
// departure) to OTP_THRESHOLD_MAX * 2 (max late).
const CENTRE = OTP_THRESHOLD_MAX;
const AXIS = OTP_THRESHOLD_MAX * 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

interface OtpThresholdSliderProps {
  early: number;
  late: number;
  onEarlyChange: (value: number) => void;
  onLateChange: (value: number) => void;
}

/**
 * Two-thumb slider representing the "early" and "late" thresholds (in minutes)
 * around a scheduled departure. Mirrors the overlay technique used by the
 * shared TimeRangeSlider but on a symmetric minutes axis.
 */
export const OtpThresholdSlider = ({
  early,
  late,
  onEarlyChange,
  onLateChange,
}: OtpThresholdSliderProps) => {
  const safeEarly = clamp(
    Number.isFinite(early) ? early : OTP_THRESHOLD_MIN,
    OTP_THRESHOLD_MIN,
    OTP_THRESHOLD_MAX,
  );
  const safeLate = clamp(
    Number.isFinite(late) ? late : OTP_THRESHOLD_MIN,
    OTP_THRESHOLD_MIN,
    OTP_THRESHOLD_MAX,
  );

  const earlyPos = CENTRE - safeEarly; // 0..19
  const latePos = CENTRE + safeLate; // 21..40

  const leftPct = (earlyPos / AXIS) * 100;
  const rightPct = 100 - (latePos / AXIS) * 100;

  const handleEarly = (event: ChangeEvent<HTMLInputElement>) => {
    const pos = Number.parseInt(event.target.value, 10);
    onEarlyChange(clamp(CENTRE - pos, OTP_THRESHOLD_MIN, OTP_THRESHOLD_MAX));
  };

  const handleLate = (event: ChangeEvent<HTMLInputElement>) => {
    const pos = Number.parseInt(event.target.value, 10);
    onLateChange(clamp(pos - CENTRE, OTP_THRESHOLD_MIN, OTP_THRESHOLD_MAX));
  };

  return (
    <div className={styles.slider}>
      <div className={styles.labels}>
        <span>Early</span>
        <span className={styles.scheduled}>Scheduled departure</span>
        <span>Late</span>
      </div>
      <div className={styles.track}>
        <div className={styles.early} style={{ width: `${leftPct}%` }} />
        <div
          className={styles.onTime}
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />
        <div className={styles.late} style={{ width: `${rightPct}%` }} />
        <div className={styles.center} />
      </div>
      <input
        className={styles.input}
        type="range"
        min={0}
        max={CENTRE - 1}
        value={earlyPos}
        aria-label="Early threshold in minutes before the scheduled departure"
        onChange={handleEarly}
      />
      <input
        className={styles.input}
        type="range"
        min={CENTRE + 1}
        max={AXIS}
        value={latePos}
        aria-label="Late threshold in minutes after the scheduled departure"
        onChange={handleLate}
      />
    </div>
  );
};
