import { SiriVMPositions } from "@prisma/client";
import { Context } from "../../context.js";
import { getDate, isSameOrBefore } from "../../lib/dayjs.js";
import { ExpectedJourneyType, getAvlPoints, getExpectedJourneys } from "../../lib/otp.js";
import { EventStatsType } from "../../types";
import { getVehicleStats } from "../../lib/feedMonitoring.js";
import { GraphQLResolveInfo } from "graphql";

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

export const getLiveStats = async (parent, db: Context, info: GraphQLResolveInfo) => {
    const queryName = info.operation.name?.value;
    let last20Mins: SiriVMPositions[] = [];
    let expected: ExpectedJourneyType[] = [];
    const currentDate = getDate()
    if (queryName === "operatorLiveStatus") {
      [expected, last20Mins] = await Promise.all([
        getExpectedJourneys(db, parent.operatorId, currentDate, 90),
        getAvlPoints(db, parent.operatorId, currentDate, true),
      ]);
    }

    const vechileRefs = new Set<string>();
    const groupIds = new Set(expected.map((journey) => journey.group_id));
    last20Mins = last20Mins.filter((avl) => {
      if (groupIds.has(avl.group_id)) {
        if (!vechileRefs.has(avl.vehicle_ref)) {
          vechileRefs.add(avl.vehicle_ref);
        }
        return true;
      }

      return false;
    });

    return {
      operatorId: parent.operatorId,
      ...parent.liveStats,
      expectedVehicles: expected.length,
      currentVehicles: vechileRefs.size,
      avl: last20Mins,
      expected: expected,
    };
  }