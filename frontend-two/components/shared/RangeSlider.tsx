import { ChangeEvent, ReactNode } from "react";

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
   * Track decorations rendered inside the track element — e.g. a "selected"
   * fill or coloured regions. Positioning is the caller's responsibility.
   */
  children?: ReactNode;
  id?: string;
  className?: string;
}

/**
 * Shared two-thumb range slider primitive.
 *
 * Owns the fiddly cross-browser overlay mechanics and thumb/track styling
 * (`.range-slider*` in common.scss). Callers supply per-thumb min/max/value and
 * any bespoke track decorations as children, keeping domain-specific mapping,
 * formatting and colours in the calling component (e.g. TimeRangeSlider,
 * OtpThresholdSlider).
 */
export const RangeSlider = ({
  thumbs,
  children,
  id,
  className,
}: RangeSliderProps) => (
  <div className={`range-slider${className ? ` ${className}` : ""}`} id={id}>
    <div className="range-slider__track">{children}</div>
    {thumbs.map((thumb, index) => (
      <input
        key={index}
        className="range-slider__input"
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
