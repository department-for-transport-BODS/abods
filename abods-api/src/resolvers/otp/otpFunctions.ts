import { Db } from "typeorm";
import { Context } from "../../context";
import { OperatorPerformanceType, OperatorType } from "../../types";
import { ExpectedOperators, ExpectedServices } from "@prisma/client";

// Summary: Fetch all operators for user
export const getOperators = async (SessionUser: any, db: Context) => {
  try {
    if(!SessionUser){
      throw("Not Authorized")
    }

    const userOrganisationIds : number[] = SessionUser.userOrganisations.map(userOrganisation => userOrganisation.organisation_id)

    const operators = await db.prisma.expectedOperators.findMany({
      where:{
        organization_id: {
          in: userOrganisationIds
        }
      }
    })

    if(!operators)
    {
      throw("No operators found")
    }

    return operators.map((operator): OperatorType => {return mapOperatorToOperatorType(operator) as OperatorType})
    
  } catch (error) {
    console.log(error)
    return null;
  }
} 

const mapOperatorToOperatorType = (operator: ExpectedOperators): OperatorType => {
  return {
    operatorId: String(operator.expected_operator_id),
    nocCode: operator.noc,
    name: operator.operator_name,
    adminAreas: []
  }
}

export const getAdminAreas = async (adminAreaIds : String[], sessionUser: any, db: Context) => {
  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
    // needs admin area view??
    const adminAreas = null; //await db.prisma.operatorAdminArea.findMany()

    if(!adminAreas){
      throw("No admin areas found")
    }

    return adminAreas; //.filter(a=>adminAreaIds.includes(a.adminAreaId))

  } catch (error) {
    console.error(error)
    return null;
  }
}

const getOperatorIdsForUser = async (userOrgs) => {
  // TODO: fetch an array of operator ids that user can touch...
}

export const getServiceInfo = async (serviceId, sessionUser: any, db: Context) => {
  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
    const service : ExpectedServices | null = await db.prisma.expectedServices.findUnique({
      where:{
        expected_service_id: serviceId
        // AND operator id is in users operatorid array
      }
    })

    if(!service){
      throw("No service found")
    }

    return {
      serviceId: service.expected_service_id,
      serviceNumber: service.service_name,
      serviceName: service.service_name
    };

  } catch (error) {
    console.error(error)
    return null;
  }
}

export const getOperator = async (operatorId, sessionUser: any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }

    // TODO: is operator id in users' operator id array

    const operator : ExpectedOperators | null = await db.prisma.expectedOperators.findUnique({
      where:{
        expected_operator_id: operatorId
      },
      include:
      {
        expected_services: true
      }
    })

    if(!operator){
      throw("No operator found")
    }

    return {
      operatorId: operator.expected_operator_id,
      transitModel: null,
    };

  } catch (error) {
    console.error(error)
    return null;
  }

  // for a service for an operator, get me all stops and their name/long/latutude
  // servicePattern name


  // return {
  //   __typename: "OperatorType",
  //   operatorId: operatorId,
  //   transitModel: {
  //     __typename: "TransitModelType",
  //     lines: ({ filterBy }) => ({
  //       __typename: "PaginatedLineType",
  //       items: filterBy.lineIds.map(lineId => ({
  //         __typename: "LineType",
  //         lineId: lineId,
  //         lineName: "Line " + lineId,
  //         servicePatterns: [
  //           {
  //             __typename: "ServicePatternType",
  //             servicePatternId: "SP1",
  //             name: "Pattern 1",
  //             stops: [
  //               {
  //                 __typename: "StopType",
  //                 stopId: "S1",
  //                 stopName: "Stop 1", // naptan
  //                 lon: -122.406417, // naptan
  //                 lat: 37.785834 // naptan
  //               },
  //               {
  //                 __typename: "StopType",
  //                 stopId: "S2",
  //                 stopName: "Stop 2",
  //                 lon: -122.406417,
  //                 lat: 37.785834
  //               }
  //             ],
  //             serviceLinks: [
  //               {
  //                 __typename: "ServiceLinkType",
  //                 fromStop: "S1",
  //                 toStop: "S2",
  //                 distance: 100,
  //                 routeValidity: "Valid",
  //                 linkRoute: "Main Route"
  //               }
  //             ]
  //           }
  //         ]
  //       }))
  //     })
  //   }
  // }
}

export const getDelayFrequency = async (inputs, sessionUser:any, db: Context) => {
  try {

    if(!sessionUser){
      throw ("Not authorized")
    }

    // bucket is the number difference in the OTP table
    // freq is the count of that difference

    return [
      { bucket: 1, frequency: 5 },
      { bucket: 2, frequency: 15 }
    ];
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getJourneyScheduledStartTimes = async (sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }

    return [
      {
        days: ['Mon', 'Wed', 'Fri'],
        fromDate: '2024-01-01',
        startTimes: ['08:00', '10:00', '12:00'],
        toDate: '2024-01-31'
      }
    ];

  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getOperatorPerformance = async (inputs, sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
      // OTP table -> operator
  // completed: Int
  // early: Int
  // late: Int
  // onTime: Int

  // get inputs
  const {fromTimestamp, toTimestamp, filters, paging, sortBy} = inputs;

  let opPerformances : OperatorPerformanceType[] = [];

  // get an array of user's org's operator nocs.
  const userOperators = await getOperators(sessionUser, db);

  if(!userOperators){
    throw("No operators for user")
  }

  const operatorNocs = userOperators.map(op => op.nocCode)

  // fetch all OTP entries where operator is in user's org's operator list, and within the timestamp date range.
  const otp_entries = await db.prisma.bODS_OTP.findMany({
    where:
    {
      operator_noc:{
        in: operatorNocs
      },
      AND:{
        date:{
          gte: fromTimestamp,
          lte: toTimestamp
        }
      }
    }
  })

  if(!otp_entries)
  {
      throw("No OTP entries")
  }

  userOperators.forEach(operator => {
    const operator_otp_entries = otp_entries.filter(o=>o.operator_noc == operator.nocCode)
    const earlies = operator_otp_entries.filter(o => o.state == "early");
    const lates = operator_otp_entries.filter(o => o.state == "late");
    const onTimes = operator_otp_entries.filter(o => o.state == "ontime");
    const completed = operator_otp_entries.filter(o => o.actual_departure_time != null);

    let opPerformance: OperatorPerformanceType = {
      nocCode: operator.nocCode,
      operatorId: operator.operatorId,
      name: operator.name,
      early: earlies.length,
      late: lates.length,
      onTime: onTimes.length,
      averageDelay: 0, // TODO
      scheduledDepartures: operator_otp_entries.length,
      actualDepartures: completed.length
    }

    opPerformances.push(opPerformance)
  });

  return ({
    items: opPerformances,
    pageInfo: {
      next: 1,
      totalCount: opPerformances.length
    }
  })

//   return ({
//     items: [
//         {
//           __typename: 'OperatorPerformanceType',
//           nocCode: 'A123',
//           operatorId: 'op1',
//           name: 'StageCoach',
//           early: 120,
//           onTime: 300,
//           late: 80
//         },
//         {
//           __typename: 'OperatorPerformanceType',
//           nocCode: 'B456',
//           operatorId: 'op2',
//           name: 'Arriva',
//           early: 150,
//           onTime: 320,
//           late: 50
//         }
//       ]
// ,
//   pageInfo: {
//     next: 2,
//     totalCount: 10
//   }
// });
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getPunctualityDayOfWeek = async (inputs, sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }

    // get inputs
    const {fromTimestamp, toTimestamp, filters, paging, sortBy} = inputs;

    // get an array of user's org's operator nocs.
    const userOperators = await getOperators(sessionUser, db);

    if(!userOperators){
      throw("No operators for user")
    }

    const operatorNocs : string[] = userOperators.map(op => op.nocCode)

    // fetch all OTP entries where operator is in user's org's operator list, and within the timestamp date range.
    const otp_entries = await db.prisma.bODS_OTP.findMany({
      where:
      {
        operator_noc:{
          in: operatorNocs
        },
        AND:{
          date:{
            gte: fromTimestamp,
            lte: toTimestamp
          }
        }
      }
    })

    if(!otp_entries)
    {
        throw("No OTP entries")
    }

    let punctualityDaysOfWeek;
    for (let index = 1; index < 8; index++) {
      const day_otp_entries = otp_entries.filter(o=>Number(o.day_of_week)==index)
      const earlies = day_otp_entries.filter(o => o.state == "early");
      const lates = day_otp_entries.filter(o => o.state == "late");
      const onTimes = day_otp_entries.filter(o => o.state == "ontime");

      punctualityDaysOfWeek.push({
        dayOfWeek: index, 
        onTime: onTimes.length, 
        early: earlies.length, 
        late: lates.length
      })
    }

    return punctualityDaysOfWeek;

    // return [
    //   { dayOfWeek: 1, onTime: 130, early: 4, late: 8 },
    //   { dayOfWeek: 2, onTime: 140, early: 5, late: 7 }
    // ];

  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getPunctualityOverview = async (inputs, sessionUser:any, db: Context) => {
  try {
    if(!sessionUser){
      throw ("Not authorized")
    }

    // get inputs
    const {fromTimestamp, toTimestamp, filters, paging, sortBy} = inputs;
    const {timingPointsOnly} = filters;

    // get an array of user's org's operator nocs.
    const userOperators = await getOperators(sessionUser, db);

    if(!userOperators){
      throw("No operators for user")
    }

    const operatorNocs : string[] = userOperators.map(op => op.nocCode)

    // fetch all OTP entries where operator is in user's org's operator list, and within the timestamp date range.
    const otp_entries = await db.prisma.bODS_OTP.findMany({
      where:
      {
        operator_noc:{
          in: operatorNocs
        },
        AND:{
          date:{
            gte: fromTimestamp,
            lte: toTimestamp
          },
          // filters:  All stops/ Timing points (if all stops then dont send filter) == isTimingPoint = true
          ...(timingPointsOnly ? {is_timing_point: timingPointsOnly} : {})
        }
      }
    })

    if(!otp_entries)
    {
        throw("No OTP entries")
    }

  // filters: areas: adminAreaIds: ["id1", "id2"]
  // filters: onTimeMaxMinutes: int, onTimeMinMinutes: int
  // filters: dayOfWeekFlags -> only show for certain days of week

    const earlies = otp_entries.filter(o => o.state == "early");
    const lates = otp_entries.filter(o => o.state == "late");
    const onTimes = otp_entries.filter(o => o.state == "ontime");
    const completed = otp_entries.filter(o => o.actual_departure_time != null);
    const avgDeviation = 0;

    return ({
      __typename: "PunctualityTotalsType",
      early: earlies.length,
      late: lates.length,
      onTime: onTimes.length,
      scheduled: otp_entries.length,
      completed: completed.length,
      averageDeviation: avgDeviation
    });

  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getPunctualityTimeOfDay = async (inputs, sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
      // of the 10:30 slot, how many were ontime/early/late example
  return [
    { timeOfDay: "08:00", onTime: 120, early: 5, late: 10 },
    { timeOfDay: "09:00", onTime: 110, early: 6, late: 9 }
  ];
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getPunctualityTimeSeries = async (inputs, sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
        // get data
    // filter data
    // sort data

    // count where state is X (ontime/early/late) -> filter on journey -> stop -> expected operator AND this is per day

  return [
    { early: 20, late: 15, onTime: 165, ts: '2024-04-10T12:00:00Z' },
    { early: 25, late: 10, onTime: 165, ts: '2024-04-11T12:00:00Z' }];
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getServicePunctuality = async (sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
    return [
      {
        early: 50,
        late: 5,
        lineId: "line201",
        nocCode: "NC101",
        onTime: 145,
        operatorId: "operator101",
        rank: 1.0,
        trend: {
          early: 55,
          late: 3,
          onTime: 142,
          lineId: "line201",
          nocCode: "NC101",
          operatorId: "operator101",
          rank: 2.0,
          trend: null
        }
      }
    ];
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getStopPerformance = async (inputs, sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
      // for this operator & for this service, get all stops and their OTP stats 

  return [
    {
      lineId: "L100",
      stopId: "S100",
      early: 50,
      onTime: 250,
      late: 20,
      averageDelay: 1.5,
      scheduledDepartures: 320,
      actualDepartures: 310,
      timingPoint: true,
      stopIndex: 1,
      stopInfo: { // naptan data
        stopId: "S100",
        sourceId: "Source1", // naptan data
        stopName: "Central Station", // naptan data
        stopLocation: {
          latitude: 34.0522, // naptan data
          longitude: -118.2437 // naptan data
        },
        stopLocality: {
          localityId: "Loc100", // naptan data
          localityName: "Downtown", // naptan data
          localityAreaId: "Area100", // naptan data
          localityAreaName: "Central Area" // naptan data
        }
      }
    }
  ];
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getServicePerformance = async (inputs, sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
     // "servicePerformance": [
  //   {
  //       "lineId": "L100",
  //       "lineInfo": {
  //           "serviceId": "123",
  //           "serviceName": "Downtown Rapid",
  //           "serviceNumber": "100",
  //           "__typename": "ServiceInfoType"
  //       },
  //       "early": 50,
  //       "onTime": 250,
  //       "late": 20,
  //       "averageDelay": 1.5,
  //       "scheduledDepartures": 320,
  //       "actualDepartures": 310,
  //       "__typename": "ServicePerformanceType"
  //   }
  // ]

    // get all services for this operator
      // get all journies for this service
        // get all OTP stops for this journey

  return [
    {
      lineId: "L100",
      early: 50,
      onTime: 250,
      late: 20,
      averageDelay: 1.5,
      scheduledDepartures: 320,
      actualDepartures: 310,
      lineInfo: {
        serviceId: "123",
        serviceNumber: "100",
        serviceName: "Downtown Rapid"
      },
      operatorInfo: {
        operatorName: "StageCoach",
        nocCode: "A123",
        operatorId: "op1",
      }
    }
  ];
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getFrequentServices = async ( operatorId, fromTimestamp, toTimestamp, sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
    return [
      {
        serviceId: "Service123",
        serviceInfo: {
          serviceId: "Service123",
          serviceName: "Downtown Express",
          serviceNumber: "EXP123"
        }
      },
      {
        serviceId: "Service456",
        serviceInfo: {
          serviceId: "Service456",
          serviceName: "Uptown Loop",
          serviceNumber: "LOOP456"
        }
      }
    ];
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getFrequentServiceInfo = async (inputs, sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
    return {
      numHours: 150,
      totalHours: 200
    };
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getHeadwayDayOfWeek = async (lineId, sessionUser:any, db: Context) => {

  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
    return [
      { dayOfWeek: 1, actualWaitTime: 5.0, excessWaitTime: 0.5, scheduledWaitTime: 4.5 },
      { dayOfWeek: 2, actualWaitTime: 6.0, excessWaitTime: 0.6, scheduledWaitTime: 5.4 }
    ];
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getHeadwayOverview = async (inputs, sessionUser:any, db: Context) => {
  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
      // filtered on service id and operator id

  // per service - headway

  return {
    actualWaitTime: 5.5,
    scheduledWaitTime: 3.2,
    excessWaitTime: 2.3
  };

  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getHeadwayTimeOfDay = async (lineId, sessionUser:any, db: Context) => {
  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
    return [
      { timeOfDay: "08:00", actualWaitTime: 4.0, excessWaitTime: 0.4, scheduledWaitTime: 3.6 },
      { timeOfDay: "09:00", actualWaitTime: 3.8, excessWaitTime: 0.2, scheduledWaitTime: 3.6 }
    ];
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getHeadwayTimeSeries = async (lineId, sessionUser:any, db: Context) => {
  try {
    if(!sessionUser){
      throw ("Not authorized")
    }
    return [
      { ts: "2024-04-10T12:00:00Z", actualWaitTime: 5.2, excessWaitTime: 0.5, scheduledWaitTime: 4.7 },
      { ts: "2024-04-11T12:00:00Z", actualWaitTime: 5.1, excessWaitTime: 0.4, scheduledWaitTime: 4.7 }
    ];
  } catch (error) {
    console.log(error)
    return null;
  }
}