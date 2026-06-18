import { useEffect, useState } from "react";

export interface LocationLookupSelection {
  id: string;
  label: string;
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
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?country=gb&autocomplete=true&limit=5&types=place,postcode,address&access_token=${mapboxToken}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setOptions([]);
          return;
        }

        const payload = (await response.json()) as {
          features?: Array<{
            id: string;
            place_name: string;
            center?: [number, number];
            bbox?: [number, number, number, number];
          }>;
        };

        setOptions(
          (payload.features ?? []).map((feature) => ({
            id: feature.id,
            label: feature.place_name,
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
      <div className="stop-analysis-filters__location-search">
        <div className="stop-analysis-filters__location-input-wrap">
          <input
            id={id}
            className="govuk-input stop-analysis-filters__location-input"
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
          <span
            className={`stop-analysis-filters__location-chevron${open ? " stop-analysis-filters__location-chevron--open" : ""}`}
            aria-hidden="true"
          />
        </div>

        {open && !disabled && (value.trim().length === 0 || hasResults) && (
          <div
            className="stop-analysis-filters__location-results"
            role="listbox"
          >
            {value.trim().length === 0 && (
              <div className="stop-analysis-filters__location-hint">
                Type to search
              </div>
            )}
            {value.trim().length > 0 && loading && (
              <div className="stop-analysis-filters__location-loading">
                Searching...
              </div>
            )}
            {value.trim().length > 0 &&
              !loading &&
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="stop-analysis-filters__location-option"
                  onClick={() => {
                    onValueChange(option.label);
                    setOpen(false);
                    onSelect?.(option);
                  }}
                >
                  {option.label}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
