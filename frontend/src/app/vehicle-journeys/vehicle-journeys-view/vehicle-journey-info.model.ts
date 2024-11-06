import { DateTime } from "luxon";
import { AvlPoint, Stop } from "../../../generated/graphql";

export const createJourneyInfo = (stop: Stop, ping: AvlPoint | undefined) => ({
  operatorInfo: {
    nocCode: stop.operatorNoc,
    operatorName: stop.operatorName,
  },
  serviceInfo: {
    serviceName: stop.serviceName,
    serviceId: stop.serviceId,
    serviceNumber: stop.lineName,
  },
  vehicleId: ping?.vehicleRef ?? "Unknown",
  startTime: DateTime.fromISO(stop.startTime),
});

export type VehicleJourneyInfo = ReturnType<typeof createJourneyInfo>;
