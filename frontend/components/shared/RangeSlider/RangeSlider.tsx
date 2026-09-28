import styles from "./range-slider.module.scss";

import { ChangeEvent, CSSProperties, ReactNode } from "react";
import { clsx } from "clsx";

export interface RangeSliderThumb {
  /** Minimum value for this thumb's input. */
  min: number;
  /** Maximum value for this thumb's input. */
  max: number;
  /** Current value for this thumb's input. */
  value: number;
  /** Accessible label for the thumb. */
  ariaLabel: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  /** Called with the parsed numeric value when the thumb moves. */
  onChange: (value: number) => void;
}

interface RangeSliderProps {
  /** The slider's thumbs (typically two: a lower and an upper). */
  thumbs: RangeSliderThumb[];
  /**
   * Track decorations rendered inside the track element — e.g. a
   * `RangeSliderSelection` fill or bespoke coloured regions. Positioning is the
   * caller's responsibility.
   */
  children?: ReactNode;
  id?: string;
  className?: string;
}

/**
 * The default "selected range" fill. Callers position it with left/right
 * percentages rather than reaching into the slider's stylesheet.
 */
export const RangeSliderSelection = ({ style }: { style?: CSSProperties }) => (
  <div className={styles.selected} style={style} />
);

/**
 * Shared two-thumb range slider primitive.
 *
 * Owns the fiddly cross-browser overlay mechanics and thumb/track styling.
 * Callers supply per-thumb min/max/value and any bespoke track decorations as
 * children, keeping domain-specific mapping, formatting and colours in the
 * calling component (e.g. TimeRangeSlider, OtpThresholdSlider).
 */
export const RangeSlider = ({
  thumbs,
  children,
  id,
  className,
}: RangeSliderProps) => (
  <div className={clsx(styles.slider, className)} id={id}>
    <div className={styles.track}>{children}</div>

    {thumbs.map((thumb, index) => (
      <input
        key={index}
        className={styles.input}
        type="range"
        min={thumb.min}
        max={thumb.max}
        value={thumb.value}
        aria-label={thumb.ariaLabel}
        aria-invalid={thumb.ariaInvalid}
        aria-describedby={thumb.ariaDescribedBy}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          thumb.onChange(Number.parseInt(event.target.value, 10))
        }
      />
    ))}
  </div>
);
