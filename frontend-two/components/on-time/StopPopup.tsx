import mapboxgl from "mapbox-gl";
import { type MutableRefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Tooltip } from "@/components/shared/Tooltip";
import type { Map } from "mapbox-gl";

type PopupAnchor =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type StopPopupContent = {
  naptan?: string;
  stopId?: string;
  stopName?: string;
  stopLocality?: string;
};

export type StopPopupRoot = Root;

interface StopPopupRefs {
  popupRef: MutableRefObject<mapboxgl.Popup | null>;
  popupRootRef: MutableRefObject<StopPopupRoot | null>;
}

export const getStopPopupAnchor = (
  map: Map,
  coordinates: [number, number],
): PopupAnchor => {
  const point = map.project(coordinates);
  const container = map.getContainer();
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Guard bands approximate popup size so anchor flips before clipping starts.
  const verticalGuard = 130;
  const horizontalGuard = 150;

  const vertical =
    point.y < verticalGuard
      ? "top"
      : point.y > height - verticalGuard
        ? "bottom"
        : null;

  const horizontal =
    point.x < horizontalGuard
      ? "left"
      : point.x > width - horizontalGuard
        ? "right"
        : null;

  if (vertical && horizontal) {
    return `${vertical}-${horizontal}` as PopupAnchor;
  }
  if (vertical) {
    return vertical;
  }
  if (horizontal) {
    return horizontal;
  }

  // Default keeps popup above the point in normal cases.
  return "bottom";
};

interface StopPopupProps {
  stop: StopPopupContent;
}

export const StopPopup = ({ stop }: StopPopupProps) => {
  const naptan = stop.naptan ?? stop.stopId;
  const tooltipMessage = [stop.stopName, stop.stopLocality, naptan]
    .filter((value): value is string => Boolean(value))
    .join("<br />");

  return (
    <div className="on-time-service-map__popup-content">
      <div className="govuk-!-margin-bottom-1">
        <Tooltip
          message={tooltipMessage || undefined}
          className="on-time-service-map__popup-title"
          selectable
        >
          <strong>{stop.stopName ?? ""}</strong>
        </Tooltip>
      </div>
      {stop.stopLocality && (
        <div className="govuk-body-small govuk-!-margin-bottom-1">
          {stop.stopLocality}
        </div>
      )}
      {naptan && <div className="govuk-body-small">{naptan}</div>}
    </div>
  );
};

export const clearStopPopup = ({ popupRef, popupRootRef }: StopPopupRefs) => {
  popupRootRef.current?.unmount();
  popupRootRef.current = null;
  popupRef.current?.remove();
  popupRef.current = null;
};

interface ShowStopPopupOptions extends StopPopupRefs {
  map: Map;
  coordinates: [number, number];
  stop: StopPopupContent;
}

export const showStopPopup = ({
  map,
  coordinates,
  stop,
  popupRef,
  popupRootRef,
}: ShowStopPopupOptions) => {
  clearStopPopup({ popupRef, popupRootRef });

  const content = document.createElement("div");
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: "gds-popup",
    anchor: getStopPopupAnchor(map, coordinates),
    offset: 12,
  })
    .setLngLat(coordinates)
    .setDOMContent(content)
    .addTo(map);

  const root = createRoot(content);
  root.render(<StopPopup stop={stop} />);

  popup.on("close", () => {
    root.unmount();
    if (popupRootRef.current === root) {
      popupRootRef.current = null;
    }
  });

  popupRef.current = popup;
  popupRootRef.current = root;
};
