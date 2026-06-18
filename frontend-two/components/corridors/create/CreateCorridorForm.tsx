import { useMemo, useState } from "react";
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
import { LocationLookupField } from "@/components/shared/LocationLookupField";
import type { LngLatBounds } from "mapbox-gl";

type SearchMode = "location" | "stop";

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
  const [stopList, setStopList] = useState<CorridorStop[]>(
    initialCorridor?.stops ?? [],
  );
  const [mapBounds, setMapBounds] = useState<LngLatBounds | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isStopSearch = searchMode === "stop";
  const firstStopSearchEnabled =
    stopList.length === 0 &&
    (isStopSearch ? stopQuery.trim().length > 3 : stopQuery.trim().length > 0);
  const { data: firstStopData, isLoading: searchingFirstStop } = useSWR(
    firstStopSearchEnabled
      ? ["corridor-first-stop-search", stopQuery.trim()]
      : null,
    ([, query]) => corridorsService.queryStops(query),
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

  const boundsKey = mapBounds
    ? `${mapBounds.getWest().toFixed(4)},${mapBounds.getSouth().toFixed(4)},${mapBounds.getEast().toFixed(4)},${mapBounds.getNorth().toFixed(4)}`
    : null;

  const { data: otherStopsData } = useSWR(
    stopList.length > 0 && boundsKey
      ? ["corridor-other-stops", boundsKey]
      : null,
    () => corridorsService.queryStops(undefined, mapBounds ?? undefined),
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
            <div className="corridor-stop-column">
              <h2 className="govuk-heading-m govuk-!-margin-bottom-2">Stops</h2>

              <CorridorStopList
                corridorStops={stopList}
                loading={loading}
                isEdit={isEdit}
                onRemoveLastStop={removeLastStop}
              />

              <div className="corridor-stop-column__search-panel">
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
                      onValueChange={setStopQuery}
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
                        onChange={(event) => setStopQuery(event.target.value)}
                      />
                    </div>
                  )
                ) : null}

                {isStopSearch || stopList.length > 0 ? (
                  <>
                    {loading ? (
                      <p className="govuk-body">Searching for stops...</p>
                    ) : null}

                    {!loading &&
                    stopList.length === 0 &&
                    stopQuery.trim().length > 0 &&
                    stopQuery.trim().length < 4 ? (
                      <p className="govuk-body-s">
                        Enter at least 4 characters
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

              {stopList.length > 0 ? (
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
                onSelectStop={addStop}
                onBoundsChange={setMapBounds}
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
