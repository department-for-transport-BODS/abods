import { RangeSlider } from "@/components/shared/RangeSlider/RangeSlider";

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
 * around a scheduled departure. Uses the shared RangeSlider primitive and
 * layers its own coloured track regions on top.
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

  return (
    <div className="otp-threshold-slider">
      <div className="otp-threshold-slider__labels">
        <span className="otp-threshold-slider__label">Early</span>
        <span className="otp-threshold-slider__scheduled">
          <span>Scheduled departure</span>
          <span className="otp-threshold-slider__scheduled-value">0:00</span>
        </span>
        <span className="otp-threshold-slider__label">Late</span>
      </div>
      <RangeSlider
        className="otp-threshold-slider__slider"
        thumbs={[
          {
            min: 0,
            max: AXIS,
            value: earlyPos,
            ariaLabel:
              "Early threshold in minutes before the scheduled departure",
            onChange: (pos) =>
              onEarlyChange(
                clamp(CENTRE - pos, OTP_THRESHOLD_MIN, OTP_THRESHOLD_MAX),
              ),
          },
          {
            min: 0,
            max: AXIS,
            value: latePos,
            ariaLabel:
              "Late threshold in minutes after the scheduled departure",
            onChange: (pos) =>
              onLateChange(
                clamp(pos - CENTRE, OTP_THRESHOLD_MIN, OTP_THRESHOLD_MAX),
              ),
          },
        ]}
      >
        <div className="otp-threshold-slider__fill">
          <div
            className="otp-threshold-slider__early"
            style={{ width: `${leftPct}%` }}
          />
          <div
            className="otp-threshold-slider__on-time"
            style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
          />
          <div
            className="otp-threshold-slider__late"
            style={{ width: `${rightPct}%` }}
          />
        </div>
        <div className="otp-threshold-slider__center" />
      </RangeSlider>
    </div>
  );
};
