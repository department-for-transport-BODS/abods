import { SiriVMPositions } from "@prisma/client";
import { Context } from "../../context.js";
import { getDate, isSameOrBefore } from "../../lib/dayjs.js";
import { ExpectedJourneyType, getAvlPoints, getExpectedJourneys } from "../../lib/otp.js";
import { EventStatsType } from "../../types";
import { getVehicleStats } from "../../lib/feedMonitoring.js";

export const getEventStats = (): EventStatsType[] => {
    const eventStats: EventStatsType[] = [];
    let startdate = getDate().subtract(90, 'day');

    while (isSameOrBefore(startdate, getDate())) {
      eventStats.push({
        count: 0,
        day: startdate.toDate(),
      });

      startdate = startdate.add(1, "day");
    }
    return eventStats;
}

export const getVehicleStatsPerOperator = async (
  db: Context,
  operatorId: string,
  statsDate: string
) => {

  const expectedJourneys: ExpectedJourneyType[] = await getExpectedJourneys(
    db,
    operatorId,
    getDate(statsDate),
  );

  const avl: SiriVMPositions[] = await getAvlPoints(
    db,
    operatorId,
    getDate(statsDate),
    false,
    expectedJourneys.map(journey => journey.group_id)
  );

  const results = await getVehicleStats(avl, expectedJourneys)

  return results.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};