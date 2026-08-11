import { useMemo, useState } from "react";
import { CorridorHideOutliers } from "@/types/corridors";

const STORAGE_KEY = "abods.corridors.hideOutliers";

const DEFAULT_STATE: CorridorHideOutliers = {
  journeyTime: false,
  timeOfDay: false,
  dayOfWeek: false,
};

const loadFromStorage = (): CorridorHideOutliers => {
  if (typeof window === "undefined") return DEFAULT_STATE;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<CorridorHideOutliers>;
    return {
      journeyTime: !!parsed.journeyTime,
      timeOfDay: !!parsed.timeOfDay,
      dayOfWeek: !!parsed.dayOfWeek,
    };
  } catch {
    return DEFAULT_STATE;
  }
};

export const clearCorridorHideOutliersStorage = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
};

export const useCorridorHideOutliers = () => {
  const [state, setState] = useState<CorridorHideOutliers>(loadFromStorage);

  const save = (nextState: CorridorHideOutliers) => {
    setState(nextState);
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  return useMemo(
    () => ({
      hideOutliers: state,
      setJourneyTime: (value: boolean) =>
        save({ ...state, journeyTime: value }),
      setTimeOfDay: (value: boolean) => save({ ...state, timeOfDay: value }),
      setDayOfWeek: (value: boolean) => save({ ...state, dayOfWeek: value }),
      reset: () => {
        save(DEFAULT_STATE);
      },
    }),
    [state],
  );
};
