import { DateTime } from "luxon";
import { PerformanceParams } from "@/services/on-time/on-time.service";

/**
 * Builds a default PerformanceParams covering the last 7 full days, optionally
 * scoped to an operator (NOC code) and/or a specific service (line id).
 *
 * The on-time, headway, performance, transit-model and stop-performance
 * services all derive their inputs from this shape, mirroring how the Angular
 * on-time page composes its `PerformanceParams` from URL query state.
 */
export const buildDefaultParams = (options?: {
  nocCode?: string | null;
  lineId?: string | null;
  now?: DateTime;
}): PerformanceParams => {
  const now = (options?.now ?? DateTime.now()).startOf("day");
  const from = now.minus({ days: 7 });
  return {
    fromTimestamp: from.toISO() ?? "",
    toTimestamp: now.toISO() ?? "",
    filters: {
      operatorIds: options?.nocCode ? [options.nocCode] : undefined,
      lineIds: options?.lineId ? [options.lineId] : undefined,
    },
  };
};
