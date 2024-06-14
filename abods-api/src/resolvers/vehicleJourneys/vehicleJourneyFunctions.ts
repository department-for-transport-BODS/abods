import { Context } from "../../context"
import { UniqueJourneyType, VehicleReplayInputType } from "../../types"

export const findJourneys = (inputs: VehicleReplayInputType, sessionUser: any, db: Context): [UniqueJourneyType] => {
    return  [
      {
          vehicleJourneyId: "VJ923c019c47e1c96648deffd8690ea2cbcb433e3f",
          startTime: new Date().toISOString(),
          serviceInfo: {
              serviceName: "Ancaster - Welbourn",
              serviceNumber: "WM06",
              serviceId: "test"
          },
      }
    ]
  }
  