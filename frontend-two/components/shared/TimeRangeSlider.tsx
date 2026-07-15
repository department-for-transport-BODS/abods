import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { RangeSlider } from "@/components/shared/RangeSlider";

const MIN_HOUR = 0;
const MAX_START_HOUR = 23;
const MIN_END_HOUR = 1;
const MAX_END_HOUR = 24;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const toTwoDigit = (value: number) => value.toString().padStart(2, "0");

const formatStartTime = (hour: number) => `${toTwoDigit(hour)}:00`;
const formatEndTime = (exclusiveEndHour: number) =>
  `${toTwoDigit(exclusiveEndHour - 1)}:59`;

const parseStartHour = (value: string): number => {
  const match = value.match(/^(\d{2}):00$/);
  if (!match) return 0;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? 0 : clamp(parsed, MIN_HOUR, MAX_START_HOUR);
};

const parseEndHour = (value: string): number => {
  const match = value.match(/^(\d{2}):(00|59)$/);
  if (!match) return 24;
  const parsed = Number.parseInt(match[1], 10);
  if (Number.isNaN(parsed)) return 24;
  return clamp(parsed + 1, MIN_END_HOUR, MAX_END_HOUR);
};

interface TimeRangeSliderProps {
  labelMin?: string;
  labelMax?: string;
  legend?: string;
  legendSize?: "s" | "m" | "l";
  error?: string;
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export const TimeRangeSlider = ({
  labelMin = "Start time",
  labelMax = "End time",
  legend = "Time range",
  legendSize = "s",
  error,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: TimeRangeSliderProps) => {
  const startHour = parseStartHour(startTime);
  const parsedEndHour = parseEndHour(endTime);
  const endHour = Math.max(parsedEndHour, startHour + 1);
  const [startInputValue, setStartInputValue] = useState(startHour.toString());
  const [endInputValue, setEndInputValue] = useState((endHour - 1).toString());

  useEffect(() => {
    setStartInputValue(startHour.toString());
  }, [startHour]);

  useEffect(() => {
    setEndInputValue((endHour - 1).toString());
  }, [endHour]);

  const sliderSelectedStyle = useMemo(() => {
    const left = (startHour / MAX_END_HOUR) * 100;
    const right = 100 - (endHour / MAX_END_HOUR) * 100;
    return {
      left: `${left}%`,
      right: `${right}%`,
    };
  }, [endHour, startHour]);

  const handleSliderStartChange = (value: number) => {
    const nextStart = clamp(
      value,
      MIN_HOUR,
      Math.min(MAX_START_HOUR, endHour - 1),
    );
    onStartTimeChange(formatStartTime(nextStart));
  };

  const handleSliderEndChange = (value: number) => {
    const nextEnd = clamp(
      value,
      Math.max(MIN_END_HOUR, startHour + 1),
      MAX_END_HOUR,
    );
    onEndTimeChange(formatEndTime(nextEnd));
  };

  const handleStartInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setStartInputValue(raw);

    if (raw === "") {
      return;
    }

    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      return;
    }

    const nextStart = clamp(
      parsed,
      MIN_HOUR,
      Math.min(MAX_START_HOUR, endHour - 1),
    );
    onStartTimeChange(formatStartTime(nextStart));
  };

  const handleEndInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setEndInputValue(raw);

    if (raw === "") {
      return;
    }

    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      return;
    }

    const nextEnd = clamp(
      parsed + 1,
      Math.max(MIN_END_HOUR, startHour + 1),
      MAX_END_HOUR,
    );
    onEndTimeChange(formatEndTime(nextEnd));
  };

  const commitStartInput = () => {
    const parsed = Number.parseInt(startInputValue, 10);
    const fallback = startHour;
    const nextStart = Number.isNaN(parsed)
      ? fallback
      : clamp(parsed, MIN_HOUR, Math.min(MAX_START_HOUR, endHour - 1));

    onStartTimeChange(formatStartTime(nextStart));
    setStartInputValue(nextStart.toString());
  };

  const commitEndInput = () => {
    const parsed = Number.parseInt(endInputValue, 10);
    const fallback = endHour - 1;
    const nextEndInputValue = Number.isNaN(parsed)
      ? fallback
      : clamp(parsed, MIN_HOUR, MAX_START_HOUR);
    const nextEnd = clamp(
      nextEndInputValue + 1,
      Math.max(MIN_END_HOUR, startHour + 1),
      MAX_END_HOUR,
    );

    onEndTimeChange(formatEndTime(nextEnd));
    setEndInputValue((nextEnd - 1).toString());
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  const errorId = error ? "time-range-slider-error" : undefined;

  return (
    <div
      className={`govuk-form-group${error ? " govuk-form-group--error" : ""}`}
    >
      <fieldset className="govuk-fieldset">
        {legend ? (
          <legend
            className={`govuk-fieldset__legend govuk-fieldset__legend--${legendSize}`}
          >
            {legend}
          </legend>
        ) : null}

        {error ? (
          <p id={errorId} className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span> {error}
          </p>
        ) : null}

        <RangeSlider
          id="time-range-slider"
          thumbs={[
            {
              min: MIN_HOUR,
              max: MAX_START_HOUR,
              value: startHour,
              ariaLabel: labelMin,
              ariaInvalid: Boolean(error),
              ariaDescribedBy: errorId,
              onChange: handleSliderStartChange,
            },
            {
              min: MIN_END_HOUR,
              max: MAX_END_HOUR,
              value: endHour,
              ariaLabel: labelMax,
              ariaInvalid: Boolean(error),
              ariaDescribedBy: errorId,
              onChange: handleSliderEndChange,
            },
          ]}
        >
          <div className="range-slider__selected" style={sliderSelectedStyle} />
        </RangeSlider>

        <div className="time-range-slider__textboxes">
          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="range-slider-min">
              {labelMin}
            </label>
            <div className="govuk-input__wrapper">
              <input
                id="range-slider-min"
                name="range-slider-min"
                className={`govuk-input${error ? " govuk-input--error" : ""}`}
                type="number"
                min={MIN_HOUR}
                max={MAX_START_HOUR}
                value={startInputValue}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId}
                onChange={handleStartInputChange}
                onBlur={commitStartInput}
                onKeyDown={handleInputKeyDown}
              />
              <div className="govuk-input__suffix" aria-hidden="true">
                :00
              </div>
            </div>
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="range-slider-max">
              {labelMax}
            </label>
            <div className="govuk-input__wrapper">
              <input
                id="range-slider-max"
                name="range-slider-max"
                className={`govuk-input${error ? " govuk-input--error" : ""}`}
                type="number"
                min={MIN_HOUR}
                max={MAX_START_HOUR}
                value={endInputValue}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId}
                onChange={handleEndInputChange}
                onBlur={commitEndInput}
                onKeyDown={handleInputKeyDown}
              />
              <div className="govuk-input__suffix" aria-hidden="true">
                :59
              </div>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
};
