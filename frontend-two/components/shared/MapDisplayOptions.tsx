import { useEffect, useId, useRef, useState } from "react";
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";

type MapStyle = "street" | "satellite";

interface MapDisplayOptionsProps {
  activeStyle: MapStyle;
  mapboxSatelliteStyle?: string;
  onStyleChange: (style: MapStyle) => void;
}

export const MapDisplayOptions = ({
  activeStyle,
  mapboxSatelliteStyle,
  onStyleChange,
}: MapDisplayOptionsProps) => {
  const optionsRef = useRef<HTMLDivElement>(null);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const reactId = useId();
  const suffix = reactId.replace(/:/g, "");
  const panelId = `map-display-options-panel-${suffix}`;
  const toggleName = `map-display-options-${suffix}`;

  useEffect(() => {
    if (!showDisplayOptions) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (optionsRef.current?.contains(event.target as Node)) {
        return;
      }

      setShowDisplayOptions(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowDisplayOptions(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDisplayOptions]);

  if (!mapboxSatelliteStyle) {
    return null;
  }

  return (
    <div ref={optionsRef} className="map-display-options">
      <button
        type="button"
        className={`govuk-button govuk-button--secondary govuk-!-margin-bottom-0 map-display-options__summary${showDisplayOptions ? " map-display-options__summary--open" : ""}`}
        aria-haspopup="true"
        aria-expanded={showDisplayOptions}
        aria-controls={panelId}
        onClick={() => setShowDisplayOptions((current) => !current)}
      >
        Display options
      </button>
      <div
        id={panelId}
        className={`map-display-options__panel${showDisplayOptions ? " map-display-options__panel--open" : ""}`}
        role="group"
        aria-label="Map view"
        aria-hidden={!showDisplayOptions}
      >
        <p className="govuk-body govuk-!-margin-bottom-1">
          <strong>Map view</strong>
        </p>
        <SegmentedToggle
          legend="Map view"
          hideLegend
          name={toggleName}
          value={activeStyle}
          onChange={onStyleChange}
          options={[
            { value: "street", label: "Street" },
            { value: "satellite", label: "Satellite" },
          ]}
        />
      </div>
    </div>
  );
};
