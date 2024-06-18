import { equal } from "assert";
import { Context } from "../../context";
import { OperatorPerformanceType, OperatorType, ServicePunctualityType, SessionUser, StopPerformanceType, StopType } from "../../types";

function divideAndRound(number: number): number {
  const result = number /60;
  return Math.round(result);
}

function roundToNearestHour(time: Date): number {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  return minutes >= 30 ? (hours + 1) % 24 : hours
}

interface DayCount {
  dayOfWeek: number;
  early: number;
  onTime: number;
  late: number;
}

interface TimeCount {
  timeOfDay: string;
  early: number;
  onTime: number;
  late: number;
}

interface delayFrequencyRecord {
  bucket: number,
  frequency: number
}

const dayOfWeek: DayCount[] = Array.from({length: 7}, (_, i) => ({
  dayOfWeek: i+1,
  early: 0,
  late: 0,
  onTime: 0
}))



export const getOperatorList = async (sessionUser: SessionUser, db: Context) => {
  try {
    if(!sessionUser.user){
      throw("Not Authorized")
    }

    console.log(new Date().toLocaleString() + " getOperatorList")

    const userOperators = await getOperators(sessionUser, db);

    if(!userOperators){
      throw("No operators for user")
    }

    return ({
      items: userOperators
    })
  } catch (error) {
    console.log(error)
    return null;
  }
} 

const getOperators = async (sessionUser: SessionUser, db: Context, adminAreaIds?: string[]) => {
  try {
    if(!sessionUser.user){
      throw("Not Authorized")
    }

    if(!sessionUser.userOrganisationIDs){
      throw("User not in any organisations")
    }

    let adminAreaNumberIds: number[] = []

    if(adminAreaIds && adminAreaIds.length > 0)
    {
        adminAreaNumberIds = adminAreaIds.map(str => parseInt(str, 10))
    }

      const operators = await db.prisma.all_operators.findMany({
        where: {
          ...(adminAreaNumberIds.length > 0 ? {
            noc_adminareas: {
            some: {
              adminarea_id: {
                in: adminAreaNumberIds
              }
            }
          }
          } : {}),
          operatorOrganisations:{
            some:{
              organisation_id: {
                in: sessionUser.userOrganisationIDs
              }
            }
          }
        },
        include: {
          noc_adminareas: true
        }
        })

        if(!operators)
        {
          throw("No operators found")
        }

        const userOperators = operators.map((operator): OperatorType => {return mapOperatorToOperatorType(operator, operator.noc_adminareas) as OperatorType})
        return userOperators;
    
  } catch (error) {
    console.log(error)
    return null;
  }
} 

const mapOperatorToOperatorType = (operator, adminAreas): OperatorType => {
  const adminAreaIds = adminAreas.map(adminArea => {
    return {
      adminAreaId: adminArea.adminarea_id
    }
  })
  
  return {
    operatorId: operator.operatorref,
    nocCode: operator.operatorref,
    name: operator.name,
    adminAreas: adminAreaIds
  }
}

export const getServiceInfo = async (serviceId, sessionUser: SessionUser, db: Context) => {
  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    // get user's operator ids
    const operators = await getOperators(sessionUser, db);

    if(!operators){
      throw("No user operators")
    }

    const userOperatorIds = operators.map(o=>o.nocCode)

    const service = await db.prisma.timetable.findFirst({
      where:{
        service_code: serviceId
      }
    })

    if(!service){
      throw("No service found")
    }

    return {
      serviceId: service.service_code,
      serviceNumber: service.line_name,
      serviceName: service.line_name
    };

  } catch (error) {
    console.error(error)
    return null;
  }
}

export const getOperator = async (operatorId, lineId,  sessionUser: SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    // TODO: is operator id in users' operator id array
    console.log("getOperator op: {0} line: {1}", operatorId, lineId)

    const operator = await db.prisma.all_operators.findUnique({
      where:{
        operatorref: operatorId
      }
    })

    if(!operator){
      throw("No operator found")
    }

  const operators = await getOperators(sessionUser, db);
      
  if(!operators){
    throw("No user operators")
  }
  
    const userOperatorIds = operators.map(o=>o.nocCode)

    const operator_noc_to_filter = operatorId;

    if(userOperatorIds.includes(operator_noc_to_filter))
    {

      // fetch all otp rows for this operator and service
      const lineIds = [lineId];
      const operatorIds = [operatorId]

      const date7DaysAgo = new Date();
      date7DaysAgo.setDate(date7DaysAgo.getDate() - 7)
      const dateTs = `${date7DaysAgo.getFullYear()}-${String(date7DaysAgo.getMonth() + 1).padStart(2, '0')}-${String(date7DaysAgo.getDate() + 1).padStart(2, '0')}T00:00:00.000+01:00`

      const otpRecords = await db.prisma.timetable.findMany({
        where: {
          operator_noc:{
            in: operatorIds
          },
          AND:{
            // any in last 7 days
            date_of_journey:{
              gte: dateTs
            },
  
            // only get services in lineIds arr
            ...(lineIds ? {service_code: {
              in: lineIds
            }} : {}),
        }}
      })

      console.log("getOperator found otprecords for line: " + JSON.stringify(lineIds) + " " + otpRecords.length)

      let stops: StopType[] = [];
      let lineName = "";

      // add all unique stops to the list
      for (let i = 0; i < otpRecords.length; i++) {
         const otpRecord = otpRecords[i];

         if(otpRecord.line_name && lineName != "")
          {
            lineName = otpRecord.line_name;
          }
         

         if(otpRecord.stop_id){
          const index = stops.findIndex(d=>d.stopId == String(otpRecord.stop_id))
          if(index == -1)
            {
              stops.push({
                stopId: String(otpRecord.stop_id),
                stopName: otpRecord.common_name ? otpRecord.common_name : "", // naptan
                lon: otpRecord.stop_longitude ? Number(otpRecord.stop_longitude) : 0, // naptan
                lat: otpRecord.stop_latitude ? Number(otpRecord.stop_latitude) : 0,// naptan
              });
            }
         }
      }


    let operatorPayload: OperatorType = {
      operatorId: operator.operatorref,
      name: operator.name,
      nocCode: operator.operatorref,
      transitModel: {
        lines: {
          items: [{
            lineId: lineId,
            lineName: lineName,
            lineNumber: lineName,
            onTimePerformance: [],
            servicePatterns: [
              {
                servicePatternId: "SP1",
                name: "Pattern 1",
                stops: stops,
                serviceLinks: []
              }
            ]
          }]
        }
      }
    };

    return operatorPayload;
  }
  else return null;

  } catch (error) {
    console.error(error)
    return null;
  }

  // for a service for an operator, get me all stops and their name/long/latutude
  // servicePattern name



}

export const getPunctualityOverview = async (inputs, sessionUser:SessionUser, db: Context) => {
  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    var startTimer = performance.now()

    const {fromTimestamp, toTimestamp, filters, paging, sortBy, state, departureNullCheck} = inputs;
    const {timingPointsOnly, adminAreaIds, operatorIds, startTime, endTime, maxDelay, minDelay, lineIds, dayOfWeekFlags} = filters;

    console.log(new Date().toLocaleString() + " getPunctualityOverview")

    // get an array of user's org's operator nocs.
    const operators = await getOperators(sessionUser, db, adminAreaIds);

    if(!operators){
      throw("No user operators")
    }

    const userOperatorIds = operators.map(o=>o.nocCode)

    let nocListToFilter: string[] = [];
    if(operatorIds && operatorIds.length>0)
    {
        // filter passed in with operatorIds, check if user can access and add
        operatorIds.forEach(noc => {
          if(userOperatorIds.includes(noc)){
            nocListToFilter.push(noc)
          }
        });
    }
    else{
      nocListToFilter = userOperatorIds;
    }

    let dayOfWeekNumbers:Number[] = []
    if(dayOfWeekFlags){
      dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags)
    }

    let start = new Date();
    let end = new Date();

    if(startTime){
      const [hours, minutes, seconds] = startTime.split(':').map(Number)
      start.setHours(hours)
      start.setMinutes(minutes)
    }
  
    if(endTime){
      const [hours, minutes, seconds] = endTime.split(':').map(Number)
      end.setHours(hours)
      end.setMinutes(minutes)
    }

    const prisma_filters = {
      operator_noc:{ in: nocListToFilter },
      date_of_journey:{ gte: fromTimestamp, lte: toTimestamp },
      ...(timingPointsOnly ? {timing_point: timingPointsOnly} : {}),
      ...(dayOfWeekFlags ? { day_of_week: { in: dayOfWeekNumbers as number[] }} : {}),
      ...((startTime && endTime) ? { expected_departure_hour: { gte: start, lte: end }} : {
        ...(startTime ? { expected_departure_hour: { gte: start }} : {
          ...(endTime ? {expected_departure_hour: { lte: end }} : {})
        }),
      }),
      ...(minDelay ? {
        ...(minDelay == '-10' ? {
          maximum_early_10: { gt: 0}
        }: {
          ...(minDelay == '-20' ? {
            maximum_early_20: { gt: 0}
          }: {
            ...(minDelay == '-30' ? {
              maximum_early_30: { gt: 0}
            }: {
              ...(minDelay == '-40' ? {
                maximum_early_40: { gt: 0}
              }: {
                ...(minDelay == '-50' ? {
                  maximum_early_50: { gt: 0}
                }: {
                  ...(minDelay == '-60' ? {
                    maximum_early_60: { gt: 0}
                  }: {
                    
                  })
                })
              })
            })
          })
        })
      }:{}),
      ...(maxDelay ? {
        ...(maxDelay == '10' ? {
          maximum_late_10: { gt: 0}
        }: {
          ...(maxDelay == '20' ? {
            maximum_late_20: { gt: 0}
          }: {
            ...(maxDelay == '30' ? {
              maximum_late_30: { gt: 0}
            }: {
              ...(maxDelay == '40' ? {
                maximum_late_40: { gt: 0}
              }: {
                ...(maxDelay == '50' ? {
                  maximum_late_50: { gt: 0}
                }: {
                  ...(maxDelay == '60' ? {
                    maximum_late_60: { gt: 0}
                  }: {
                    
                  })
                })
              })
            })
          })
        })
      }:{}),
      ...(lineIds ? {service_code: {
        in: lineIds
      }} : {}),
    }

    let results;

    if(lineIds){
      results = await db.prisma.aa_otp_stats_summary_soc.aggregate({
        where:prisma_filters,
        _sum:{
          early_count:true,
          late_count: true,
          on_time_count: true,
          completed: true,
          scheduled: true
        }
      })
    }
    else{
      results = await db.prisma.aa_otp_stats_summary.aggregate({
        where:prisma_filters,
        _sum:{
          early_count:true,
          late_count: true,
          on_time_count: true,
          completed: true,
          scheduled: true
        }
      })
    }

    if(results){
      let totalOntime = results._sum.on_time_count, totalEarly = results._sum.early_count, totalLate = results._sum.late_count, totalscheduled = results._sum.scheduled, totalCompleted = results._sum.completed;
      var endTimer = performance.now()
  
      console.log(`Call to getPunctualityOverview took ${endTimer - startTimer} milliseconds`)
  
      return ({
        __typename: "PunctualityTotalsType",
        early: totalEarly,
        late: totalLate,
        onTime: totalOntime,
        scheduled: totalscheduled,
        completed: totalCompleted,
        averageDeviation: 0
      });
    }

    return null;

  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getOperatorPerformance = async (inputs, sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    var startTimer = performance.now()

  let opPerformances : OperatorPerformanceType[] = [];

  const {fromTimestamp, toTimestamp, filters, paging, sortBy, state, departureNullCheck} = inputs;
  const {timingPointsOnly, adminAreaIds, operatorIds, startTime, endTime, maxDelay, minDelay, lineIds, dayOfWeekFlags} = filters;

  console.log(new Date().toLocaleString() + " getOperatorPerformance")

  // get an array of user's org's operator nocs.
  const operators = await getOperators(sessionUser, db, adminAreaIds);

  if(!operators){
    throw("No user operators")
  }

  const userOperatorIds = operators.map(o=>o.nocCode)

  let dayOfWeekNumbers:Number[] = []
  if(dayOfWeekFlags){
    dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags)
  }

  let start = new Date();
  let end = new Date();

  if(startTime){
    const [hours, minutes, seconds] = startTime.split(':').map(Number)
    start.setHours(hours)
    start.setMinutes(minutes)
  }

  if(endTime){
    const [hours, minutes, seconds] = endTime.split(':').map(Number)
    end.setHours(hours)
    end.setMinutes(minutes)
  }

  const prisma_filters = {
    operator_noc:{ in: userOperatorIds },
    date_of_journey:{ gte: fromTimestamp, lte: toTimestamp },
    ...(timingPointsOnly ? {timing_point: timingPointsOnly} : {}),
    ...(dayOfWeekFlags ? { day_of_week: { in: dayOfWeekNumbers as number[] }} : {}),
    ...((startTime && endTime) ? { expected_departure_hour: { gte: start, lte: end }} : {
      ...(startTime ? { expected_departure_hour: { gte: start }} : {
        ...(endTime ? {expected_departure_hour: { lte: end }} : {})
      }),
    }),
    ...(minDelay ? {
      ...(minDelay == '-10' ? {
        maximum_early_10: { gt: 0}
      }: {
        ...(minDelay == '-20' ? {
          maximum_early_20: { gt: 0}
        }: {
          ...(minDelay == '-30' ? {
            maximum_early_30: { gt: 0}
          }: {
            ...(minDelay == '-40' ? {
              maximum_early_40: { gt: 0}
            }: {
              ...(minDelay == '-50' ? {
                maximum_early_50: { gt: 0}
              }: {
                ...(minDelay == '-60' ? {
                  maximum_early_60: { gt: 0}
                }: {
                  
                })
              })
            })
          })
        })
      })
    }:{}),
    ...(maxDelay ? {
      ...(maxDelay == '10' ? {
        maximum_late_10: { gt: 0}
      }: {
        ...(maxDelay == '20' ? {
          maximum_late_20: { gt: 0}
        }: {
          ...(maxDelay == '30' ? {
            maximum_late_30: { gt: 0}
          }: {
            ...(maxDelay == '40' ? {
              maximum_late_40: { gt: 0}
            }: {
              ...(maxDelay == '50' ? {
                maximum_late_50: { gt: 0}
              }: {
                ...(maxDelay == '60' ? {
                  maximum_late_60: { gt: 0}
                }: {
                  
                })
              })
            })
          })
        })
      })
    }:{})
  }

  const results = await db.prisma.aa_otp_stats_summary.groupBy({
    by:['operator_noc'],
    where:prisma_filters,
    _sum:{
      early_count:true,
      late_count: true,
      on_time_count: true,
      completed: true,
      scheduled: true
    }
  })

  for (let i = 0; i < operators.length; i++) {
    const operatorOtpStats = results.filter(o=>o.operator_noc == operators[i].nocCode)
    if(operatorOtpStats[0] && operatorOtpStats[0]._sum)
    {
      let totalOntime = operatorOtpStats[0]._sum.on_time_count ?operatorOtpStats[0]._sum.on_time_count : 0, 
      totalEarly = operatorOtpStats[0]._sum.early_count?operatorOtpStats[0]._sum.early_count : 0, 
      totalLate = operatorOtpStats[0]._sum.late_count?operatorOtpStats[0]._sum.late_count : 0, 
      totalscheduled = operatorOtpStats[0]._sum.scheduled?operatorOtpStats[0]._sum.scheduled : 0, 
      totalCompleted = operatorOtpStats[0]._sum.completed?operatorOtpStats[0]._sum.completed : 0;
      
          let opPerformance: OperatorPerformanceType = {
            nocCode: operators[i].nocCode,
            operatorId: operators[i].nocCode,
            name: operators[i].name,
            early: totalEarly,
            late: totalLate,
            onTime: totalOntime,
            averageDelay: 0, // TODO
            scheduledDepartures: totalscheduled,
            actualDepartures: totalCompleted
          }
          opPerformances.push(opPerformance)
      }
    }

  var ret = {
    items: opPerformances,
    pageInfo: {
      next: opPerformances.length,
      totalCount: opPerformances.length
    }
  }

  var endTimer = performance.now()
  console.log(`Call to getOperatorPerformance took ${endTimer - startTimer} milliseconds`)

  return (ret)

  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getPunctualityDayOfWeek = async (inputs, sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    const {fromTimestamp, toTimestamp, filters, paging, sortBy} = inputs;
    const {timingPointsOnly, adminAreaIds, startTime, endTime, maxDelay, minDelay, dayOfWeekFlags, operatorIds, granularity, lineIds} = filters;

    // fetch all otp records group by time difference
    if(operatorIds.length == 1)
      {

        console.log("getPunctualityDayOfWeek id: " + JSON.stringify(operatorIds))
        const operators = await getOperators(sessionUser, db);
  
        if(!operators){
          throw("No user operators")
        }
      
        const userOperatorIds = operators.map(o=>o.nocCode)
  
        const operator_noc_to_filter = operatorIds[0];
  
        if(userOperatorIds.includes(operator_noc_to_filter))
        {

          let dayOfWeekNumbers:Number[] = []
          if(dayOfWeekFlags){
            dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags)
          }
      
          let start = new Date();
          let end = new Date();
      
          if(startTime){
            const [hours, minutes, seconds] = startTime.split(':').map(Number)
            start.setHours(hours)
            start.setMinutes(minutes)
          }
        
          if(endTime){
            const [hours, minutes, seconds] = endTime.split(':').map(Number)
            end.setHours(hours)
            end.setMinutes(minutes)
          }
      
          const prisma_filters = {
            operator_noc:{ equals: operator_noc_to_filter },
            date_of_journey:{ gte: fromTimestamp, lte: toTimestamp },
            ...(timingPointsOnly ? {timing_point: timingPointsOnly} : {}),
            ...(dayOfWeekFlags ? { day_of_week: { in: dayOfWeekNumbers as number[] }} : {}),
            ...((startTime && endTime) ? { expected_departure_hour: { gte: start, lte: end }} : {
              ...(startTime ? { expected_departure_hour: { gte: start }} : {
                ...(endTime ? {expected_departure_hour: { lte: end }} : {})
              }),
            }),
            ...(minDelay ? {
              ...(minDelay == '-10' ? {
                maximum_early_10: { gt: 0}
              }: {
                ...(minDelay == '-20' ? {
                  maximum_early_20: { gt: 0}
                }: {
                  ...(minDelay == '-30' ? {
                    maximum_early_30: { gt: 0}
                  }: {
                    ...(minDelay == '-40' ? {
                      maximum_early_40: { gt: 0}
                    }: {
                      ...(minDelay == '-50' ? {
                        maximum_early_50: { gt: 0}
                      }: {
                        ...(minDelay == '-60' ? {
                          maximum_early_60: { gt: 0}
                        }: {
                          
                        })
                      })
                    })
                  })
                })
              })
            }:{}),
            ...(maxDelay ? {
              ...(maxDelay == '10' ? {
                maximum_late_10: { gt: 0}
              }: {
                ...(maxDelay == '20' ? {
                  maximum_late_20: { gt: 0}
                }: {
                  ...(maxDelay == '30' ? {
                    maximum_late_30: { gt: 0}
                  }: {
                    ...(maxDelay == '40' ? {
                      maximum_late_40: { gt: 0}
                    }: {
                      ...(maxDelay == '50' ? {
                        maximum_late_50: { gt: 0}
                      }: {
                        ...(maxDelay == '60' ? {
                          maximum_late_60: { gt: 0}
                        }: {
                          
                        })
                      })
                    })
                  })
                })
              })
            }:{}),
            ...(lineIds ? {service_code: {
              in: lineIds
            }} : {}),
          }

          let results;

          if(lineIds){
            results = await db.prisma.aa_otp_stats_summary_soc.groupBy({
              by:['day_of_week'],
              where:prisma_filters,
              _sum:{
                early_count:true,
                late_count: true,
                on_time_count: true
              }
            })
          }
          else{
            results = await db.prisma.aa_otp_stats_summary.groupBy({
              by:['day_of_week'],
              where:prisma_filters,
              _sum:{
                early_count:true,
                late_count: true,
                on_time_count: true
              }
            })
          }
      
          if(results)
          {
            for (let i = 0; i < dayOfWeek.length; i++) {
              const day = dayOfWeek[i];
              const dayRecord = results.filter(d=>d.day_of_week == i);
              day.early += dayRecord[0]._sum.early_count? dayRecord[0]._sum.early_count : 0;
              day.onTime += dayRecord[0]._sum.on_time_count? dayRecord[0]._sum.on_time_count : 0;
              day.late += dayRecord[0]._sum.late_count? dayRecord[0]._sum.late_count : 0;
            }
          }


        }
      }

  return dayOfWeek;

  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getJourneyScheduledStartTimes = async (sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
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

export const getDelayFrequency = async (inputs, sessionUser:SessionUser, db: Context) => {
  try {

    if(!sessionUser.user){
      throw ("Not authorized")
    }

    console.log("getDelayFrequency")

    // bucket is the number difference in the OTP table
    // freq is the count of that difference

    const {fromTimestamp, toTimestamp, filters, paging, sortBy} = inputs;
    const {timingPointsOnly, adminAreaIds, startTime, endTime, maxDelay, minDelay, dayOfWeekFlags, operatorIds, granularity, lineIds} = filters;

    let delaysBuckets: delayFrequencyRecord[] = [];

    // fetch all otp records group by time difference
    if(operatorIds.length == 1)
      {

        console.log("getDelayFrequency id: " + JSON.stringify(operatorIds))
        const operators = await getOperators(sessionUser, db);
  
        if(!operators){
          throw("No user operators")
        }
      
        const userOperatorIds = operators.map(o=>o.nocCode)
  
        const operator_noc_to_filter = operatorIds[0];
  
        if(userOperatorIds.includes(operator_noc_to_filter))
        {
          // get all rows for operator in summary table
          let dayOfWeekNumbers:Number[] = []
          if(dayOfWeekFlags){
            dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags)
          }
      
          let start = new Date();
          let end = new Date();
      
          if(startTime){
            const [hours, minutes, seconds] = startTime.split(':').map(Number)
            start.setHours(hours)
            start.setMinutes(minutes)
          }
        
          if(endTime){
            const [hours, minutes, seconds] = endTime.split(':').map(Number)
            end.setHours(hours)
            end.setMinutes(minutes)
          }
      
          const prisma_filters = {
            operator_noc:{ equals: operator_noc_to_filter },
            date_of_journey:{ gte: fromTimestamp, lte: toTimestamp },
            ...(timingPointsOnly ? {timing_point: timingPointsOnly} : {}),
            ...(dayOfWeekFlags ? { day_of_week: { in: dayOfWeekNumbers as number[] }} : {}),
            ...((startTime && endTime) ? { expected_departure_hour: { gte: start, lte: end }} : {
              ...(startTime ? { expected_departure_hour: { gte: start }} : {
                ...(endTime ? {expected_departure_hour: { lte: end }} : {})
              }),
            }),
            ...(minDelay ? {
              ...(minDelay == '-10' ? {
                maximum_early_10: { gt: 0}
              }: {
                ...(minDelay == '-20' ? {
                  maximum_early_20: { gt: 0}
                }: {
                  ...(minDelay == '-30' ? {
                    maximum_early_30: { gt: 0}
                  }: {
                    ...(minDelay == '-40' ? {
                      maximum_early_40: { gt: 0}
                    }: {
                      ...(minDelay == '-50' ? {
                        maximum_early_50: { gt: 0}
                      }: {
                        ...(minDelay == '-60' ? {
                          maximum_early_60: { gt: 0}
                        }: {
                          
                        })
                      })
                    })
                  })
                })
              })
            }:{}),
            ...(maxDelay ? {
              ...(maxDelay == '10' ? {
                maximum_late_10: { gt: 0}
              }: {
                ...(maxDelay == '20' ? {
                  maximum_late_20: { gt: 0}
                }: {
                  ...(maxDelay == '30' ? {
                    maximum_late_30: { gt: 0}
                  }: {
                    ...(maxDelay == '40' ? {
                      maximum_late_40: { gt: 0}
                    }: {
                      ...(maxDelay == '50' ? {
                        maximum_late_50: { gt: 0}
                      }: {
                        ...(maxDelay == '60' ? {
                          maximum_late_60: { gt: 0}
                        }: {
                          
                        })
                      })
                    })
                  })
                })
              })
            }:{}),
            ...(lineIds ? {service_code: {
              in: lineIds
            }} : {}),
          }

          let results;

          if(lineIds){
            results = await db.prisma.aa_otp_stats_summary_soc.findMany({
              where:prisma_filters,
              select: {
                avg_time_difference:true,
                scheduled: true
              }
            })
          }else{
            results = await db.prisma.aa_otp_stats_summary.findMany({
              where:prisma_filters,
              select: {
                avg_time_difference:true,
                scheduled: true
              }
            })
          }
      
          if(results){
            results.forEach(res => {
              if(res.avg_time_difference > 0 && res.scheduled > 0)
                {
                  const avgDiff = Math.round(res.avg_time_difference);
                  const index = delaysBuckets.findIndex(d=>d.bucket == avgDiff)
                  if(index !== -1)
                    {
                      const freq = delaysBuckets.find(d=>d.bucket == avgDiff)
                      delaysBuckets.splice(index, 1);
                      delaysBuckets.push({
                        bucket: avgDiff,
                        frequency: freq?.frequency ? freq?.frequency + res.scheduled : res.scheduled
                      })
                    }
                  else  {
                      delaysBuckets.push({
                        bucket: avgDiff,
                        frequency: res.scheduled
                      })
                    }
                }
            })
          }
        }
      }

    return delaysBuckets;
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getPunctualityTimeOfDay = async (inputs, sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }
      // of the 10:30 slot, how many were ontime/early/late example

      const hoursOfDay: TimeCount[] = Array.from({length: 24}, (_, i) => ({
        timeOfDay: `${i.toString().padStart(2, '0')}:00`,
        early: 0,
        late: 0,
        onTime: 0
      }))

      console.log("getPunctualityTimeOfDay")

    // bucket is the number difference in the OTP table
    // freq is the count of that difference

    const {fromTimestamp, toTimestamp, filters, paging, sortBy} = inputs;
    const {timingPointsOnly, adminAreaIds, startTime, endTime, maxDelay, minDelay, dayOfWeekFlags, operatorIds, granularity, lineIds} = filters;

    // fetch all otp records group by time difference
    if(operatorIds.length == 1)
      {

        console.log("getPunctualityTimeOfDay id: " + JSON.stringify(operatorIds))
        const operators = await getOperators(sessionUser, db);
  
        if(!operators){
          throw("No user operators")
        }
      
        const userOperatorIds = operators.map(o=>o.nocCode)
  
        const operator_noc_to_filter = operatorIds[0];
  
        if(userOperatorIds.includes(operator_noc_to_filter))
        {

          let dayOfWeekNumbers:Number[] = []
          if(dayOfWeekFlags){
            dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags)
          }
      
          let start = new Date();
          let end = new Date();
      
          if(startTime){
            const [hours, minutes, seconds] = startTime.split(':').map(Number)
            start.setHours(hours)
            start.setMinutes(minutes)
          }
        
          if(endTime){
            const [hours, minutes, seconds] = endTime.split(':').map(Number)
            end.setHours(hours)
            end.setMinutes(minutes)
          }
      
          const prisma_filters = {
            operator_noc:{ equals: operator_noc_to_filter },
            date_of_journey:{ gte: fromTimestamp, lte: toTimestamp },
            ...(timingPointsOnly ? {timing_point: timingPointsOnly} : {}),
            ...(dayOfWeekFlags ? { day_of_week: { in: dayOfWeekNumbers as number[] }} : {}),
            ...((startTime && endTime) ? { expected_departure_hour: { gte: start, lte: end }} : {
              ...(startTime ? { expected_departure_hour: { gte: start }} : {
                ...(endTime ? {expected_departure_hour: { lte: end }} : {})
              }),
            }),
            ...(minDelay ? {
              ...(minDelay == '-10' ? {
                maximum_early_10: { gt: 0}
              }: {
                ...(minDelay == '-20' ? {
                  maximum_early_20: { gt: 0}
                }: {
                  ...(minDelay == '-30' ? {
                    maximum_early_30: { gt: 0}
                  }: {
                    ...(minDelay == '-40' ? {
                      maximum_early_40: { gt: 0}
                    }: {
                      ...(minDelay == '-50' ? {
                        maximum_early_50: { gt: 0}
                      }: {
                        ...(minDelay == '-60' ? {
                          maximum_early_60: { gt: 0}
                        }: {
                          
                        })
                      })
                    })
                  })
                })
              })
            }:{}),
            ...(maxDelay ? {
              ...(maxDelay == '10' ? {
                maximum_late_10: { gt: 0}
              }: {
                ...(maxDelay == '20' ? {
                  maximum_late_20: { gt: 0}
                }: {
                  ...(maxDelay == '30' ? {
                    maximum_late_30: { gt: 0}
                  }: {
                    ...(maxDelay == '40' ? {
                      maximum_late_40: { gt: 0}
                    }: {
                      ...(maxDelay == '50' ? {
                        maximum_late_50: { gt: 0}
                      }: {
                        ...(maxDelay == '60' ? {
                          maximum_late_60: { gt: 0}
                        }: {
                          
                        })
                      })
                    })
                  })
                })
              })
            }:{}),
            ...(lineIds ? {service_code: {
              in: lineIds
            }} : {}),
          }

          let results;

          if(lineIds){
            results = await db.prisma.aa_otp_stats_summary_soc.groupBy({
              by:['expected_departure_hour'],
              where:prisma_filters,
              _sum:{
                early_count:true,
                late_count: true,
                on_time_count: true
              }
            })
          }
          else{
            results = await db.prisma.aa_otp_stats_summary.groupBy({
              by:['expected_departure_hour'],
              where:prisma_filters,
              _sum:{
                early_count:true,
                late_count: true,
                on_time_count: true
              }
            })
          }
          
          if(results){
            results.forEach(res => {
              if(res.expected_departure_hour){
                const hour = roundToNearestHour(res.expected_departure_hour);
                hoursOfDay[hour].early += res._sum.early_count? res._sum.early_count : 0;
                hoursOfDay[hour].onTime += res._sum.on_time_count? res._sum.on_time_count : 0;
                hoursOfDay[hour].late += res._sum.late_count? res._sum.late_count : 0;
              }
            })
          }
      }
    }


  return hoursOfDay;
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getPunctualityTimeSeries = async (inputs, sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    console.log(new Date().toLocaleString() + " getPunctualityTimeSeries")

    const {fromTimestamp, toTimestamp, filters, paging, sortBy} = inputs;
    const {timingPointsOnly, adminAreaIds, startTime, endTime, maxDelay, minDelay, dayOfWeekFlags, operatorIds, granularity, lineIds} = filters;


    // count where state is X (ontime/early/late) -> filter on journey -> stop -> expected operator AND this is per day

    if(granularity == "day" && operatorIds.length == 1)
    {
      // get an array of user's org's operator nocs.
      const operators = await getOperators(sessionUser, db);

      if(!operators){
        throw("No user operators")
      }
    
      const userOperatorIds = operators.map(o=>o.nocCode)

      const operator_noc_to_filter = operatorIds[0];

      if(userOperatorIds.includes(operator_noc_to_filter))
      {

        let dayOfWeekNumbers:Number[] = []
        if(dayOfWeekFlags){
          dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags)
        }
      
        const start = new Date(fromTimestamp);
        const end = new Date(toTimestamp);
      
        if(startTime){
          const [hours, minutes, seconds] = startTime.split(':').map(Number)
          start.setHours(hours)
          start.setMinutes(minutes)
        }
      
        if(endTime){
          const [hours, minutes, seconds] = endTime.split(':').map(Number)
          end.setHours(hours)
          end.setMinutes(minutes)
        }
      
        const prisma_filters = {
          operator_noc:{ equals: operator_noc_to_filter },
          date_of_journey:{ gte: fromTimestamp, lte: toTimestamp },
          ...(timingPointsOnly ? {timing_point: timingPointsOnly} : {}),
          ...(dayOfWeekFlags ? { day_of_week: { in: dayOfWeekNumbers as number[] }} : {}),
          ...((startTime && endTime) ? { expected_departure_hour: { gte: start, lte: end }} : {
            ...(startTime ? { expected_departure_hour: { gte: start }} : {
              ...(endTime ? {expected_departure_hour: { lte: end }} : {})
            }),
          }),
          ...(minDelay ? {
            ...(minDelay == '-10' ? {
              maximum_early_10: { gt: 0}
            }: {
              ...(minDelay == '-20' ? {
                maximum_early_20: { gt: 0}
              }: {
                ...(minDelay == '-30' ? {
                  maximum_early_30: { gt: 0}
                }: {
                  ...(minDelay == '-40' ? {
                    maximum_early_40: { gt: 0}
                  }: {
                    ...(minDelay == '-50' ? {
                      maximum_early_50: { gt: 0}
                    }: {
                      ...(minDelay == '-60' ? {
                        maximum_early_60: { gt: 0}
                      }: {
                        
                      })
                    })
                  })
                })
              })
            })
          }:{}),
          ...(maxDelay ? {
            ...(maxDelay == '10' ? {
              maximum_late_10: { gt: 0}
            }: {
              ...(maxDelay == '20' ? {
                maximum_late_20: { gt: 0}
              }: {
                ...(maxDelay == '30' ? {
                  maximum_late_30: { gt: 0}
                }: {
                  ...(maxDelay == '40' ? {
                    maximum_late_40: { gt: 0}
                  }: {
                    ...(maxDelay == '50' ? {
                      maximum_late_50: { gt: 0}
                    }: {
                      ...(maxDelay == '60' ? {
                        maximum_late_60: { gt: 0}
                      }: {
                        
                      })
                    })
                  })
                })
              })
            })
          }:{}),
          ...(lineIds ? {service_code: {
            in: lineIds
          }} : {}),
        }

        const days = getDaysInRange(start, end)

        const summary = days.map(date=> ({
          ts: date.toISOString(), 
          early: 0,
          late: 0,
          onTime: 0
        }))

        const dateToSummary: DayCount[] = [];
        summary.forEach(daySummary => {
          const dateKey = daySummary.ts.split('T')[0]
          dateToSummary[dateKey] = daySummary;
        })

        // get a sum per day
        let results;
        if(lineIds){
          results = await db.prisma.aa_otp_stats_summary_soc.groupBy({
            by:['date_of_journey'],
            where:prisma_filters,
            _sum:{
              early_count:true,
              late_count: true,
              on_time_count: true
            }
          })
        }else{
          results = await db.prisma.aa_otp_stats_summary.groupBy({
            by:['date_of_journey'],
            where:prisma_filters,
            _sum:{
              early_count:true,
              late_count: true,
              on_time_count: true
            }
          })
        }

        if(results){
          results.forEach(result => {
            if(result && result._sum)
              {
                const dateOfJourney = result.date_of_journey.toISOString().split('T')[0];
                if(dateOfJourney in dateToSummary) {
                  const daySymmary = dateToSummary[dateOfJourney];

                  if(daySymmary){
                    daySymmary.early = result._sum.early_count ? result._sum.early_count : 0;
                    daySymmary.onTime = result._sum.on_time_count;
                    daySymmary.late = result._sum.late_count;
                  }
                }
              }
          });
        }

        return summary;
      }
    }

  return null;
  } catch (error) {
    console.log(error)
    return null;
  }
}


function getDaysInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  while(currentDate <= endDate){
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates;
}

export const getServicePunctuality = async (sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
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

export const getStopPerformance = async (inputs, sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }
      // for this operator & for this service, get all stops and their OTP stats 

      const {fromTimestamp, toTimestamp, filters, paging, sortBy} = inputs;
      const {timingPointsOnly, adminAreaIds, startTime, endTime, maxDelay, minDelay, dayOfWeekFlags, operatorIds, lineIds, granularity} = filters;
  
      let stopPerformances: StopPerformanceType[] = [];

      // fetch all otp records group by time difference
      if(operatorIds.length == 1)
        {
  
          console.log("getStopPerformance id: " + JSON.stringify(operatorIds))
          const operators = await getOperators(sessionUser, db);
    
          if(!operators){
            throw("No user operators")
          }
        
          const userOperatorIds = operators.map(o=>o.nocCode)
    
          const operator_noc_to_filter = operatorIds[0];
    
          if(userOperatorIds.includes(operator_noc_to_filter))
          {

            let dayOfWeekNumbers:Number[] = []
            if(dayOfWeekFlags){
              dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags)
            }
          
            const start = new Date(fromTimestamp);
            const end = new Date(toTimestamp);
          
            if(startTime){
              const [hours, minutes, seconds] = startTime.split(':').map(Number)
              start.setHours(hours)
              start.setMinutes(minutes)
            }
          
            if(endTime){
              const [hours, minutes, seconds] = endTime.split(':').map(Number)
              end.setHours(hours)
              end.setMinutes(minutes)
            }
          
            const prisma_filters = {
              operator_noc:{ equals: operator_noc_to_filter },
              date_of_journey:{ gte: fromTimestamp, lte: toTimestamp },
              ...(timingPointsOnly ? {timing_point: timingPointsOnly} : {}),
              ...(dayOfWeekFlags ? { day_of_week: { in: dayOfWeekNumbers as number[] }} : {}),
              ...((startTime && endTime) ? { expected_departure_hour: { gte: start, lte: end }} : {
                ...(startTime ? { expected_departure_hour: { gte: start }} : {
                  ...(endTime ? {expected_departure_hour: { lte: end }} : {})
                }),
              }),
              ...(minDelay ? {
                ...(minDelay == '-10' ? {
                  maximum_early_10: { gt: 0}
                }: {
                  ...(minDelay == '-20' ? {
                    maximum_early_20: { gt: 0}
                  }: {
                    ...(minDelay == '-30' ? {
                      maximum_early_30: { gt: 0}
                    }: {
                      ...(minDelay == '-40' ? {
                        maximum_early_40: { gt: 0}
                      }: {
                        ...(minDelay == '-50' ? {
                          maximum_early_50: { gt: 0}
                        }: {
                          ...(minDelay == '-60' ? {
                            maximum_early_60: { gt: 0}
                          }: {
                            
                          })
                        })
                      })
                    })
                  })
                })
              }:{}),
              ...(maxDelay ? {
                ...(maxDelay == '10' ? {
                  maximum_late_10: { gt: 0}
                }: {
                  ...(maxDelay == '20' ? {
                    maximum_late_20: { gt: 0}
                  }: {
                    ...(maxDelay == '30' ? {
                      maximum_late_30: { gt: 0}
                    }: {
                      ...(maxDelay == '40' ? {
                        maximum_late_40: { gt: 0}
                      }: {
                        ...(maxDelay == '50' ? {
                          maximum_late_50: { gt: 0}
                        }: {
                          ...(maxDelay == '60' ? {
                            maximum_late_60: { gt: 0}
                          }: {
                            
                          })
                        })
                      })
                    })
                  })
                })
              }:{}),
              ...(lineIds ? {service_code: {
                in: lineIds
              }} : {}),
            }
    
            // get a sum per day
            const results = await db.prisma.aa_otp_stats_summary_stops.groupBy({
              by:['stop_id', 'common_name', 'service_code', 'locality_id', 'stop_longitude', 'stop_latitude', 'timing_point'],
              where:prisma_filters,
              _sum:{
                early_count:true,
                late_count: true,
                on_time_count: true,
                scheduled: true,
                completed:true
              }
            })

            results.forEach(res => {
                stopPerformances.push({
                lineId: res.service_code,
                stopId: res.stop_id? res.stop_id : 0,
                stopInfo: {
                  stopId: res.stop_id? res.stop_id : 0,
                  stopName: res.common_name? res.common_name : "",
                  stopLocality: {
                    localityId: res.locality_id? res.locality_id : "",
                    localityName: "",
                    localityAreaId: "",
                    localityAreaName: ""
                  },
                  sourceId: "",
                  stopLocation: {
                    longitude: res.stop_longitude ? Number(res.stop_longitude):0 ,
                    latitude: res.stop_latitude ? Number(res.stop_latitude): 0
                  }
                },
                early: res._sum.early_count ? res._sum.early_count : 0,
                late: res._sum.late_count ? res._sum.late_count : 0,
                onTime: res._sum.on_time_count ? res._sum.on_time_count : 0,
                actualDepartures: res._sum.completed ? res._sum.completed: 0,
                scheduledDepartures: res._sum.scheduled ? res._sum.scheduled : 0,
                averageDelay: 0,
                timingPoint: res.timing_point? res.timing_point : false
              })
            });
          }
        }

  return stopPerformances;
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getServicePerformance = async (inputs, sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    let servicePunctualities: ServicePunctualityType[] = [];

    // get all services for this operator
      // get all journies for this service
        // get all OTP stops for this journey

        const {fromTimestamp, toTimestamp, filters, paging, sortBy} = inputs;
        const {timingPointsOnly, adminAreaIds, startTime, endTime, maxDelay, minDelay, dayOfWeekFlags, operatorIds, granularity} = filters;

        if(operatorIds.length == 1)
          {
            // get an array of user's org's operator nocs.
            const operators = await getOperators(sessionUser, db);
      
            if(!operators){
              throw("No user operators")
            }
          
            const userOperatorIds = operators.map(o=>o.nocCode)
      
            const operator_noc_to_filter = operatorIds[0];
      
            if(userOperatorIds.includes(operator_noc_to_filter))
            {
              let dayOfWeekNumbers:Number[] = []
              if(dayOfWeekFlags){
                dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags)
              }
            
              const start = new Date(fromTimestamp);
              const end = new Date(toTimestamp);
            
              if(startTime){
                const [hours, minutes, seconds] = startTime.split(':').map(Number)
                start.setHours(hours)
                start.setMinutes(minutes)
              }
            
              if(endTime){
                const [hours, minutes, seconds] = endTime.split(':').map(Number)
                end.setHours(hours)
                end.setMinutes(minutes)
              }
            
              const prisma_filters = {
                operator_noc:{ equals: operator_noc_to_filter },
                date_of_journey:{ gte: fromTimestamp, lte: toTimestamp },
                ...(timingPointsOnly ? {timing_point: timingPointsOnly} : {}),
                ...(dayOfWeekFlags ? { day_of_week: { in: dayOfWeekNumbers as number[] }} : {}),
                ...((startTime && endTime) ? { expected_departure_hour: { gte: start, lte: end }} : {
                  ...(startTime ? { expected_departure_hour: { gte: start }} : {
                    ...(endTime ? {expected_departure_hour: { lte: end }} : {})
                  }),
                }),
                ...(minDelay ? {
                  ...(minDelay == '-10' ? {
                    maximum_early_10: { gt: 0}
                  }: {
                    ...(minDelay == '-20' ? {
                      maximum_early_20: { gt: 0}
                    }: {
                      ...(minDelay == '-30' ? {
                        maximum_early_30: { gt: 0}
                      }: {
                        ...(minDelay == '-40' ? {
                          maximum_early_40: { gt: 0}
                        }: {
                          ...(minDelay == '-50' ? {
                            maximum_early_50: { gt: 0}
                          }: {
                            ...(minDelay == '-60' ? {
                              maximum_early_60: { gt: 0}
                            }: {
                              
                            })
                          })
                        })
                      })
                    })
                  })
                }:{}),
                ...(maxDelay ? {
                  ...(maxDelay == '10' ? {
                    maximum_late_10: { gt: 0}
                  }: {
                    ...(maxDelay == '20' ? {
                      maximum_late_20: { gt: 0}
                    }: {
                      ...(maxDelay == '30' ? {
                        maximum_late_30: { gt: 0}
                      }: {
                        ...(maxDelay == '40' ? {
                          maximum_late_40: { gt: 0}
                        }: {
                          ...(maxDelay == '50' ? {
                            maximum_late_50: { gt: 0}
                          }: {
                            ...(maxDelay == '60' ? {
                              maximum_late_60: { gt: 0}
                            }: {
                              
                            })
                          })
                        })
                      })
                    })
                  })
                }:{})
              }
      
              // get a sum per day
              const results = await db.prisma.aa_otp_stats_summary_soc.groupBy({
                by:['service_code'], // TODO: get data guys to add line name to table + add as group field + return
                where:prisma_filters,
                _sum:{
                  early_count:true,
                  late_count: true,
                  on_time_count: true,
                  scheduled: true,
                  completed:true
                }
              })

              results.forEach(res => {
                servicePunctualities.push({
                  lineId: res.service_code,
                  early: res._sum.early_count ? res._sum.early_count : 0,
                  late: res._sum.late_count ? res._sum.late_count : 0,
                  onTime: res._sum.on_time_count ? res._sum.on_time_count : 0,
                  scheduledDepartures: res._sum.scheduled ?  res._sum.scheduled : 0,
                  actualDepartures: res._sum.completed ? res._sum.completed : 0,
                  lineInfo: 
                  {
                    serviceId: res.service_code,
                    serviceNumber: res.service_code,
                    serviceName: res.service_code
                  },
                  rank: 1
                });
              })
            }
          }

  return servicePunctualities;

  } catch (error) {
    console.log(error)
    return null;
  }
}

// -> OPERATOR PAGE
export const getFrequentServices = async ( operatorId, fromTimestamp, toTimestamp, sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
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

export const getFrequentServiceInfo = async (inputs, sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
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

export const getHeadwayDayOfWeek = async (lineId, sessionUser:SessionUser, db: Context) => {

  try {
    if(!sessionUser.user){
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

export const getHeadwayOverview = async (inputs, sessionUser:SessionUser, db: Context) => {
  try {
    if(!sessionUser.user){
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

export const getHeadwayTimeOfDay = async (lineId, sessionUser:SessionUser, db: Context) => {
  try {
    if(!sessionUser.user){
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

export const getHeadwayTimeSeries = async (inputs, sessionUser:SessionUser, db: Context) => {
  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    return [];

    // return [
    //   { ts: "2024-04-10T12:00:00Z", actualWaitTime: 5.2, excessWaitTime: 0.5, scheduledWaitTime: 4.7 },
    //   { ts: "2024-04-11T12:00:00Z", actualWaitTime: 5.1, excessWaitTime: 0.4, scheduledWaitTime: 4.7 }
    // ];
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const getAdminAreas = async (adminAreaIds : String[], sessionUser: any, db: Context) => {
  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    const operators = await getOperators(sessionUser, db);

    if(!operators){
      throw("No operators")
    }
    const userOperatorIds = operators.map(o=>o.nocCode)

    const adminAreaRecords = await db.prisma.noc_adminarea.findMany({
      where: {
        national_operator_code: {
          in: userOperatorIds
        }
      },
      select: {
        adminarea_id: true
      }
    })

    if(adminAreaRecords){
      const adminareaIds = adminAreaRecords.map(a=>a.adminarea_id);
      const adminAreas = await db.prisma.bods_naptanadminarea.findMany({
        where: {
          naptan_admin_area_id:{
            in: adminareaIds
          }
        }
      })

      if(!adminAreas){
        throw("No admin areas found")
      }

      const ret = adminAreas.map(adminArea => {
        return{
          adminAreaId: String(adminArea.naptan_admin_area_id),
          adminAreaName:adminArea.name, 
          shape: ""
        }
      })

      return ret;
    }

    return null;

  } catch (error) {
    console.error(error)
    return null;
  }
}

// helpers
function getDayOfWeekNumbers(dayOfWeekFlags: any){
  let dayOfWeekNumbers:Number[] = []
  if(dayOfWeekFlags.monday==true) dayOfWeekNumbers.push(0)
  if(dayOfWeekFlags.tuesday==true) dayOfWeekNumbers.push(1) 
  if(dayOfWeekFlags.wednesday==true) dayOfWeekNumbers.push(2)
  if(dayOfWeekFlags.thursday==true) dayOfWeekNumbers.push(3)
  if(dayOfWeekFlags.friday==true) dayOfWeekNumbers.push(4)
  if(dayOfWeekFlags.saturday==true) dayOfWeekNumbers.push(5)
  if(dayOfWeekFlags.sunday==true) dayOfWeekNumbers.push(6)
  return dayOfWeekNumbers;
}

const getFiltersForOTPQuery = (inputs, userOperatorNocList:string[]) => {
  let {fromTimestamp, toTimestamp, filters, paging, sortBy, state, departureNullCheck} = inputs;
  const {timingPointsOnly, adminAreaIds, operatorIds, startTime, endTime, maxDelay, minDelay, lineIds, dayOfWeekFlags} = filters;

  //console.log(new Date().toLocaleString() + " getFiltersForOTPQuery: inputs = " + JSON.stringify(inputs))

  let dayOfWeekNumbers:Number[] = []
  if(dayOfWeekFlags){
    dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags)
  }
  
  // operator nocs
  let tempNocList: string[] = [];
  if(operatorIds && operatorIds.length>0)
  {
      // filter passed in with operatorIds, check if user can access and add
      operatorIds.forEach(noc => {
        if(userOperatorNocList.includes(noc)){
          tempNocList.push(noc)
        }
      });
  }
  else{
    tempNocList = userOperatorNocList;
  }

  // date cap to today for performance WILL REMOVE

  // hard cap data to 1 day if operators is higher than 10 TEMPORARY
  // if(tempNocList.length > 10){
  //   const today = new Date();
  //   const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00.000+01:00`
  //   const tommorrowString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 1).padStart(2, '0')}T00:00:00.000+01:00`
  //   fromTimestamp = todayString;
  //   toTimestamp = tommorrowString;
  // }

  let start = new Date();
  let end = new Date();

  if(startTime){
    const [hours, minutes, seconds] = startTime.split(':').map(Number)
    start.setHours(hours)
    start.setMinutes(minutes)
  }

  if(endTime){
    const [hours, minutes, seconds] = endTime.split(':').map(Number)
    end.setHours(hours)
    end.setMinutes(minutes)
  }

  let queryArgs = {
        operator_noc:{
          in: tempNocList
        },
        AND:{
          date_of_journey:{
            gte: fromTimestamp,
            lte: toTimestamp
          },
          // for count completed 
          ...(departureNullCheck ? {actual_departure_time: {
            not: null
          }} : {}),

          // All stops/ Timing points (if all stops then dont send filter) == isTimingPoint = true
          ...(timingPointsOnly ? {is_timing_point: timingPointsOnly} : {}),

          // minDelay = maximum early time, negative figure
          ...(minDelay ? {time_difference: {
            gte: String[minDelay]
          }} : {}),

          // maxDelay = maximum late time
          ...(maxDelay ? {time_difference: {
            lte: maxDelay
          }} : {}),

          // dayOfWeekFlags = where day is in this array
          ...(dayOfWeekFlags ? {
            day_of_week: {
            in: dayOfWeekNumbers as number[]
          }} : {}),

          // startTime where darparture time is after 
          ...(startTime ? {expected_departure_time: {
            gte: start
          }} : {}),

          // endTime where 
          ...(endTime ? {expected_departure_time: {
            lte: end
          }} : {}),

          // for count otp_state
          ...(state ? {otp_state:state} : {}),


          // only get services in lineIds arr
          ...(lineIds ? {service_code: {
            in: lineIds
          }} : {}),

        }
  }

  return queryArgs;    
}

