import styles from "./range-slider.module.scss";

import { ChangeEvent, ReactNode } from "react";

export interface RangeSliderThumb {
  min: number;
  max: number;
  value: number;
  ariaLabel: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  onChange: (value: number) => void;
}

interface RangeSliderProps {
  thumbs: RangeSliderThumb[];
  children?: ReactNode;
  id?: string;
  className?: string;
}

export const RangeSlider = ({
  thumbs,
  children,
  id,
  className,
}: RangeSliderProps) => (
  <div
    className={`${styles.slider}${className ? ` ${className}` : ""}`}
    id={id}
  >
    <div className={styles.track}>
      {children}
    </div>

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
          thumb.onChange(
            Number.parseInt(event.target.value, 10),
          )
        }
      />
    ))}
  </div>
);