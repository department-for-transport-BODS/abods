import { Journey } from "../../generated/graphql";
import { DateTime } from "luxon";

export const formatJourneyStartTime = (journey: Journey) =>
  DateTime.fromISO(journey.startTime)
    .setZone("Europe/London")
    .toFormat("HH:mm");
