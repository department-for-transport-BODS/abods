import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import styles from "./location-lookup-field.module.scss";
import {
  buildLocationContext,
  buildLocationSearchTypes,
  type GeocodingFeature,
} from "@/types/mapbox";

const LOCATION_SEARCH_TYPES = buildLocationSearchTypes([
  "poi",
  "region",
  "country",
]);

export interface LocationLookupSelection {
  id: string;
  label: string;
  context?: string;
  center?: [number, number];
  bbox?: [number, number, number, number];
}

interface LocationLookupFieldProps {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect?: (selection: LocationLookupSelection) => void;
  mapboxToken?: string;
  containerClassName?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const LocationLookupField = ({
  id,
  label,
  value,
  onValueChange,
  onSelect,
  mapboxToken,
  containerClassName,
  placeholder = "Search",
  disabled = false,
}: LocationLookupFieldProps) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<LocationLookupSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] =
    useState<LocationLookupSelection | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) setSelectedOption(null);
  }, [value]);

  const clearSelection = (initialValue: string) => {
    setSelectedOption(null);
    onValueChange(initialValue);
    setOpen(true);
    window.setTimeout(() => {
      const input = inputRef.current;
      if (input) {
        input.focus();
        input.setSelectionRange(initialValue.length, initialValue.length);
      }
    }, 0);
  };

  useEffect(() => {
    if (disabled || !mapboxToken || value.trim().length < 3) {
      setOptions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        const encodedQuery = encodeURIComponent(value.trim());
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?country=gb&autocomplete=true&limit=5&types=${LOCATION_SEARCH_TYPES}&access_token=${mapboxToken}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setOptions([]);
          return;
        }

        const payload = (await response.json()) as {
          features?: GeocodingFeature[];
        };

        setOptions(
          (payload.features ?? []).map((feature) => ({
            id: feature.id,
            label: feature.text,
            context: buildLocationContext(feature.context ?? []),
            center: feature.center,
            bbox: feature.bbox,
          })),
        );
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [disabled, mapboxToken, value]);

  const hasResults = value.trim().length > 0 && (loading || options.length > 0);

  return (
    <div className={containerClassName}>
      <label className="govuk-label" htmlFor={id}>
        {label}
      </label>
      <div className={styles.search}>
        <div className={styles.inputWrap}>
          {selectedOption ? (
            <div className={clsx("govuk-input", styles.input, styles.selected)}>
              <span className={styles.selectedText}>
                <span>{selectedOption.label}</span>
                {selectedOption.context && (
                  <span className={styles.optionContext}>
                    {selectedOption.context}
                  </span>
                )}
              </span>
              <input
                ref={overlayRef}
                id={id}
                className={styles.overlayInput}
                type="text"
                value=""
                aria-label={selectedOption.label}
                onChange={(e) => clearSelection(e.target.value)}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setOpen(false), 120);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  else if (e.key === "Backspace" || e.key === "Delete")
                    clearSelection("");
                }}
              />
            </div>
          ) : (
            <input
              ref={inputRef}
              id={id}
              className={clsx("govuk-input", styles.input)}
              type="text"
              value={value}
              onChange={(event) => {
                onValueChange(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setOpen(false), 120);
              }}
              placeholder={placeholder}
              aria-label={label}
              disabled={disabled}
            />
          )}
          {(selectedOption || value) && (
            <button
              type="button"
              className={styles.clear}
              aria-label="Clear location"
              onMouseDown={(e) => {
                e.preventDefault();
                setSelectedOption(null);
                onValueChange("");
                setOpen(false);
                window.setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
              ×
            </button>
          )}
          <span
            className={clsx(styles.chevron, open && styles.chevronOpen)}
            aria-hidden="true"
          />
        </div>

        {open &&
          !disabled &&
          (selectedOption || value.trim().length === 0 || hasResults) && (
            <div className={styles.results} role="listbox">
              {value.trim().length === 0 && (
                <div className={styles.hint}>Type to search</div>
              )}
              {value.trim().length > 0 && loading && (
                <div className={styles.loading}>Searching...</div>
              )}
              {value.trim().length > 0 &&
                !loading &&
                options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={styles.option}
                    onClick={() => {
                      setSelectedOption(option);
                      onValueChange(option.label);
                      setOpen(false);
                      onSelect?.(option);
                    }}
                  >
                    {option.label}
                    {option.context && (
                      <span className={styles.optionContext}>
                        {option.context}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          )}
      </div>
    </div>
  );
};
