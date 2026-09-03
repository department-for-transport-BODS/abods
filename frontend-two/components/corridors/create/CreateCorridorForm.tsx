import styles from "./create-corridor-form.module.scss";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import useSWR, { useSWRConfig } from "swr";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { corridorsService } from "@/services/corridors/corridors.service";
import { Corridor, CorridorStop } from "@/types/corridors";
import { ErrorInfo } from "@/types";
import { CorridorCreateMap } from "@/components/corridors/create/CorridorCreateMap";
import { CorridorStopList } from "@/components/corridors/create/CorridorStopList";
import { StopSearchList } from "@/components/corridors/create/StopSearchList";
import { DeleteCorridorModal } from "@/components/corridors/create/DeleteCorridorModal";
import { Spinner } from "@/components/shared/Spinner";
import {
  LocationLookupField,
  type LocationLookupSelection,
} from "@/components/shared/LocationLookupField";
import { LngLatBounds } from "mapbox-gl";

type SearchMode = "location" | "stop";

const validLocationSearchBounds = (bounds?: LngLatBounds | null) =>
  bounds ? bounds.getEast() - bounds.getWest() < 0.9 : false;

const locationBounds = ({ bbox, center }: LocationLookupSelection) => {
  if (bbox) {
    return new LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
  }

  if (center) {
    const [longitude, latitude] = center;
    return new LngLatBounds(
      [longitude - 0.01, latitude - 0.01],
      [longitude + 0.01, latitude + 0.01],
    );
  }

  return null;
};

interface Props {
  mode: "create" | "edit";
  initialCorridor?: Corridor;
  mapboxToken?: string;
  mapboxStyle?: string;
  mapboxSatelliteStyle?: string;
}

export const CreateCorridorForm = ({
  mode,
  initialCorridor,
  mapboxToken,
  mapboxStyle,
  mapboxSatelliteStyle,
}: Props) => {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const isEdit = mode === "edit" && !!initialCorridor;

  const [name, setName] = useState(initialCorridor?.name ?? "");
  const [searchMode, setSearchMode] = useState<SearchMode>("location");
  const [stopQuery, setStopQuery] = useState("");
  const [selectedLocationBounds, setSelectedLocationBounds] =
    useState<LngLatBounds | null>(null);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [stopList, setStopList] = useState<CorridorStop[]>(
    initialCorridor?.stops ?? [],
  );
  const [mapBounds, setMapBounds] = useState<LngLatBounds | null>(null);
  const [otherStopsBounds, setOtherStopsBounds] = useState<LngLatBounds | null>(
    null,
  );
  const [submitted, setSubmitted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const stopListLengthRef = useRef(stopList.length);
  useEffect(() => {
    if (stopListLengthRef.current === 0 && stopList.length > 0) {
      setOtherStopsBounds(null);
    }
    stopListLengthRef.current = stopList.length;
  }, [stopList.length]);

  const isStopSearch = searchMode === "stop";

  // Avoid firing search on key stroke - matches angular service
  const [debouncedStopQuery, setDebouncedStopQuery] = useState(stopQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedStopQuery(stopQuery), 400);
    return () => clearTimeout(timer);
  }, [stopQuery]);

  const activeSearchBounds = mapBounds ?? selectedLocationBounds;
  const firstStopSearchEnabled =
    stopList.length === 0 &&
    (isStopSearch
      ? debouncedStopQuery.trim().length > 3
      : validLocationSearchBounds(activeSearchBounds));
  const { data: firstStopData, isLoading: searchingFirstStop } = useSWR(
    firstStopSearchEnabled
      ? isStopSearch
        ? ["corridor-first-stop-search", debouncedStopQuery.trim()]
        : ["corridor-first-stop-search", activeSearchBounds?.toArray()]
      : null,
    () =>
      corridorsService.queryStops(
        isStopSearch ? debouncedStopQuery.trim() : undefined,
        isStopSearch ? undefined : activeSearchBounds ?? undefined,
      ),
  );

  const subsequentSearchEnabled = stopList.length > 0;
  const naptanListKey = stopList.map((stop) => stop.naptan).join(",");

  const { data: subsequentStops, isLoading: searchingSubsequentStops } = useSWR(
    subsequentSearchEnabled
      ? ["corridor-subsequent-stops", naptanListKey]
      : null,
    ([,]) =>
      corridorsService.fetchSubsequentStops(
        stopList.map((stop) => stop.naptan).filter(Boolean),
      ),
  );

  const boundsKey = otherStopsBounds
    ? `${otherStopsBounds.getWest().toFixed(4)},${otherStopsBounds.getSouth().toFixed(4)},${otherStopsBounds.getEast().toFixed(4)},${otherStopsBounds.getNorth().toFixed(4)}`
    : null;

  const { data: otherStopsData } = useSWR(
    stopList.length > 0 &&
      boundsKey &&
      validLocationSearchBounds(otherStopsBounds)
      ? ["corridor-other-stops", boundsKey]
      : null,
    () => corridorsService.queryStops(undefined, otherStopsBounds ?? undefined),
  );

  const loading = searchingFirstStop || searchingSubsequentStops;

  const matchingStops = useMemo(() => {
    if (stopList.length === 0) {
      return firstStopData?.orgStops ?? [];
    }
    return subsequentStops ?? [];
  }, [stopList.length, firstStopData, subsequentStops]);

  const noData =
    !loading &&
    ((stopList.length === 0 &&
      firstStopSearchEnabled &&
      matchingStops.length === 0) ||
      (stopList.length > 0 && matchingStops.length === 0));
  const locationSearchAreaTooLarge =
    searchMode === "location" &&
    hasSelectedLocation &&
    activeSearchBounds !== null &&
    !validLocationSearchBounds(activeSearchBounds);

  const showRecentre =
    !loading &&
    (isEdit ||
      (isStopSearch
        ? matchingStops.length > 0 || stopList.length > 0
        : hasSelectedLocation));

  const nameError =
    submitted && name.trim().length === 0 ? "Name is required" : null;

  const errors: ErrorInfo[] = [
    ...(nameError
      ? [
          {
            id: "corridor-name",
            errorMessage: nameError,
          },
        ]
      : []),
    ...(actionError
      ? [
          {
            id: "corridor-create-error",
            errorMessage: actionError,
          },
        ]
      : []),
  ];

  const resetSearch = () => {
    setStopQuery("");
    setSelectedLocationBounds(null);
    setActionError(null);
  };

  const addStop = (nextStop: CorridorStop) => {
    if (loading) return;
    setStopList((current) => [...current, nextStop]);
    resetSearch();
  };

  const removeLastStop = () => {
    if (loading) return;
    setStopList((current) => current.slice(0, -1));
    setActionError(null);
  };

  const canSubmit = name.trim().length > 0 && stopList.length > 1;

  const onCancel = () => {
    router.push("/corridors").catch(() => {
      /* noop */
    });
  };

  const submitCreate = async () => {
    if (loading || creating) return;

    setSubmitted(true);
    setActionError(null);

    if (!canSubmit) return;

    setCreating(true);
    const success = await corridorsService.createCorridor(
      name.trim(),
      stopList.map((stop) => stop.stopId),
    );
    setCreating(false);

    if (success) {
      void mutate(["corridors-list"]);
      router.push("/corridors").catch(() => {
        /* noop */
      });
      return;
    }

    setActionError(
      "We're having trouble creating your corridor. Please try again later.",
    );
  };

  const submitUpdate = async () => {
    if (!initialCorridor || loading || updating) return;

    setSubmitted(true);
    setActionError(null);

    if (!canSubmit) return;

    setUpdating(true);
    const success = await corridorsService.updateCorridor({
      id: initialCorridor.id,
      name: name.trim(),
      stopList: stopList.map((stop) => stop.stopId),
    });
    setUpdating(false);

    if (success) {
      void mutate(["corridors-list"]);
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/corridors").catch(() => {
          /* noop */
        });
      }
      return;
    }

    setActionError(
      "We're having trouble updating your corridor. Please try again later.",
    );
  };

  const submitDelete = async () => {
    if (!initialCorridor || deleting) return;

    setDeleting(true);
    setActionError(null);

    const success = await corridorsService.deleteCorridor(initialCorridor.id);
    setDeleting(false);

    if (success) {
      void mutate(["corridors-list"]);
      router.push("/corridors").catch(() => {
        /* noop */
      });
      return;
    }

    setActionError(
      "We're having trouble deleting your corridor. Please try again later.",
    );
  };

  const showSearchModeSelector = !isEdit && stopList.length === 0;

  return (
    <>
      <ErrorSummary errors={errors} />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (isEdit) {
            void submitUpdate();
          } else {
            void submitCreate();
          }
        }}
      >
        <div
          className={`govuk-form-group ${nameError ? "govuk-form-group--error" : ""}`}
        >
          <label className="govuk-label" htmlFor="corridor-name">
            Enter a corridor name
          </label>
          {nameError ? (
            <p className="govuk-error-message">{nameError}</p>
          ) : null}
          <input
            id="corridor-name"
            name="corridor-name"
            type="text"
            className={`govuk-input govuk-input--width-20 ${
              nameError ? "govuk-input--error" : ""
            }`}
            value={name}
            maxLength={256}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="govuk-grid-row">
          <div className="govuk-grid-column-one-half">
            <div className={styles.corridorStopColumn}>
              <h2 className="govuk-heading-m govuk-!-margin-bottom-2">Stops</h2>

              <CorridorStopList
                corridorStops={stopList}
                loading={loading}
                isEdit={isEdit}
                onRemoveLastStop={removeLastStop}
              />

              <div className={styles.searchPanel}>
                {showSearchModeSelector ? (
                  <div className="govuk-form-group">
                    <label className="govuk-label" htmlFor="search-mode">
                      Search for the first stop in your corridor
                    </label>
                    <select
                      id="search-mode"
                      className="govuk-select"
                      value={searchMode}
                      onChange={(event) => {
                        setSearchMode(event.target.value as SearchMode);
                        setHasSelectedLocation(false);
                        resetSearch();
                      }}
                    >
                      <option value="location">Location</option>
                      <option value="stop">Stop</option>
                    </select>
                  </div>
                ) : null}

                {stopList.length === 0 ? (
                  searchMode === "location" ? (
                    <LocationLookupField
                      id="stop-query"
                      label="Location name or postcode"
                      value={stopQuery}
                      onValueChange={(value) => {
                        setStopQuery(value);
                        setSelectedLocationBounds(null);
                      }}
                      onSelect={(selection) => {
                        setSelectedLocationBounds(locationBounds(selection));
                        setHasSelectedLocation(true);
                      }}
                      mapboxToken={mapboxToken}
                      containerClassName="govuk-form-group"
                      placeholder="Search"
                    />
                  ) : (
                    <div className="govuk-form-group">
                      <label className="govuk-label" htmlFor="stop-query">
                        Stop name or NaPTAN code
                      </label>
                      <input
                        id="stop-query"
                        name="stop-query"
                        type="text"
                        className="govuk-input govuk-input--width-20"
                        placeholder="Enter four or more characters"
                        value={stopQuery}
                        onChange={(event) => {
                          setStopQuery(event.target.value);
                          setSelectedLocationBounds(null);
                        }}
                      />
                    </div>
                  )
                ) : null}

                {isStopSearch ||
                firstStopSearchEnabled ||
                locationSearchAreaTooLarge ||
                stopList.length > 0 ? (
                  <>
                    {loading ? (
                      <>
                        <h3 className="govuk-heading-s govuk-!-margin-top-6 govuk-!-margin-bottom-2">
                          Searching for stops...
                        </h3>
                        <div className="flex-row justify-content-center govuk-!-margin-6">
                          <Spinner />
                        </div>
                      </>
                    ) : null}

                    {!loading &&
                    stopList.length === 0 &&
                    stopQuery.trim().length > 0 &&
                    stopQuery.trim().length < 4 ? (
                      <p className="govuk-body-s">
                        Enter at least 4 characters
                      </p>
                    ) : null}

                    {locationSearchAreaTooLarge ? (
                      <p className="govuk-error-message">
                        Search area too large, please zoom in to show stops
                      </p>
                    ) : null}

                    {noData ? (
                      <p className="govuk-body">
                        {stopList.length === 0
                          ? "Your organisation has no matching stops"
                          : "No further stops available"}
                      </p>
                    ) : null}

                    {!loading && matchingStops.length > 0 ? (
                      <h3 className="govuk-heading-s govuk-!-margin-bottom-2">
                        {stopList.length === 0
                          ? `${matchingStops.length} matching stops`
                          : "Add further stops"}
                      </h3>
                    ) : null}

                    <StopSearchList
                      matchingStops={matchingStops}
                      isFirstStop={stopList.length === 0}
                      onAddStop={addStop}
                    />
                  </>
                ) : null}
              </div>

              {matchingStops.length > 0 || stopList.length > 0 ? (
                <div className="govuk-button-group govuk-!-margin-top-6">
                  <button
                    type="button"
                    className="govuk-button govuk-button--secondary"
                    data-module="govuk-button"
                    onClick={onCancel}
                  >
                    Cancel
                  </button>

                  {isEdit ? (
                    <button
                      type="button"
                      className="govuk-button govuk-button--secondary"
                      data-module="govuk-button"
                      disabled={loading || creating || updating}
                      onClick={() => {
                        void submitCreate();
                      }}
                    >
                      {creating ? "Saving..." : "Save as new"}
                    </button>
                  ) : null}

                  {stopList.length > 1 ? (
                    <button
                      type="submit"
                      className="govuk-button"
                      data-module="govuk-button"
                      disabled={loading || creating || updating}
                    >
                      {isEdit
                        ? updating
                          ? "Saving..."
                          : "Save"
                        : creating
                          ? "Saving..."
                          : "Finish"}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {isEdit ? (
                <div className="govuk-!-margin-top-6">
                  <button
                    type="button"
                    className="govuk-button govuk-button--warning"
                    data-module="govuk-button"
                    disabled={loading || creating || updating || deleting}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete this corridor
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="govuk-grid-column-one-half">
            {mapboxToken && mapboxStyle ? (
              <CorridorCreateMap
                corridorStops={stopList}
                matchingStops={matchingStops}
                otherStops={otherStopsData?.orgStops}
                nonOrgStops={otherStopsData?.nonOrgStops}
                locationBounds={selectedLocationBounds}
                showRecentre={showRecentre}
                onSelectStop={addStop}
                onBoundsChange={(bounds) => {
                  setMapBounds(bounds);
                  if (stopList.length > 0) {
                    setOtherStopsBounds(bounds);
                  }
                }}
                mapboxToken={mapboxToken}
                mapboxStyle={mapboxStyle}
                mapboxSatelliteStyle={mapboxSatelliteStyle}
              />
            ) : null}
          </div>
        </div>
      </form>

      {isEdit && initialCorridor ? (
        <DeleteCorridorModal
          open={showDeleteModal}
          corridorName={initialCorridor.name}
          isDeleting={deleting}
          onCancel={() => setShowDeleteModal(false)}
          onDelete={() => {
            void submitDelete();
          }}
        />
      ) : null}
    </>
  );
};
