import { Context } from "../../context";
import { LineType, OperatorPerformanceType, OperatorType, ServicePunctualityType, SessionUser, StopPerformanceType, StopType } from "../../types";
import { GraphQLResolveInfo } from "graphql";


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

const getOperatorLines = async (operatorRef: string, db: Context) => {

  const operator = await db.prisma.expectedOperators.findMany({
    where:{
      noc: operatorRef
    },
    include: {
      expected_services: true
    }
  })

  const services:  LineType[] = [];
  operator.map((op) => {
    op.expected_services.map((service) => services.push({
      lineId: service.noc_and_line,
      lineName: service.service_name,
      lineNumber:  service.line_name,
      onTimePerformance: [],
      servicePatterns: []
    }))
  })

  const transitModel: OperatorType = {
    nocCode: operatorRef,
    transitModel: {
      lines: {
        items: services 
      }
    } 
  }

  return  transitModel
}

export const getOperator = async (operatorRef: string, lineId: string,  sessionUser: SessionUser, db: Context, info: GraphQLResolveInfo) => {

  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    const operationName: string = info.operation.name?.value ?? ""

    if(operationName === 'operatorLines') {
      return getOperatorLines(operatorRef, db)
    }
    
    // TODO: is operator id in users' operator id array
    console.log("getOperator op: {0} line: {1}", operatorRef, lineId)

    const operator = await db.prisma.all_operators.findUnique({
      where:{
        operatorref: operatorRef
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

    const operator_noc_to_filter = operatorRef;

    if(userOperatorIds.includes(operator_noc_to_filter))
    {

      // fetch all otp rows for this operator and service
      let lineIds: string[] = [];
      if(lineId) {
        lineIds.push(lineId)
      }
      const operatorIds = [operatorRef]

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
            ...(lineIds && lineIds.length > 0 ? {service_code: {
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

    const {fromTimestamp, toTimestamp, filters, paging, sortBy, state, departureNullCheck} = inputs;
    const {timingPointsOnly, adminAreaIds, operatorIds, startTime, endTime, maxDelay, minDelay, lineIds, dayOfWeekFlags} = filters;

    console.log(new Date().toLocaleString() + " getPunctualityOverview")

    // get an array of user's org's operator nocs.
    const operators = await getOperators(sessionUser, db, adminAreaIds);
    //console.log(new Date().toLocaleString() + " getPunctualityOverview user operator count " + operators?.length)


    if(!operators){
      throw("No user operators")
    }

    const userOperatorIds = operators.map(o=>o.nocCode)


    inputs.state = 'OnTime';
    const otpOnTimeCount = await db.prisma.timetable.count({
      where: getFiltersForOTPQuery(inputs, userOperatorIds)
    })

    inputs.state = 'Early';
    const otpEarlyCount = await db.prisma.timetable.count({
      where: getFiltersForOTPQuery(inputs, userOperatorIds)
    })

    inputs.state = 'Late';
    const otpLateCount = await db.prisma.timetable.count({
      where: getFiltersForOTPQuery(inputs, userOperatorIds)
    })

    inputs.state = null;
    inputs.departureNullCheck = true;
    const completedCount = await db.prisma.timetable.count({
      where: getFiltersForOTPQuery(inputs, userOperatorIds)
    })

    let scheduled = otpEarlyCount + otpOnTimeCount + otpLateCount;

    return ({
      __typename: "PunctualityTotalsType",
      early: otpEarlyCount,
      late: otpLateCount,
      onTime: otpOnTimeCount,
      scheduled: scheduled,
      completed: completedCount,
      averageDeviation: 0
    });


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

  inputs.state = 'Early';
  const otpEarlyRecords = await db.prisma.timetable.groupBy({
    by:['operator_noc'],
    where: getFiltersForOTPQuery(inputs, userOperatorIds),
    _count: {
      timetable_id: true,
    },
  })

  inputs.state = 'Late';
  const otpLateRecords = await db.prisma.timetable.groupBy({
    by:['operator_noc'],
    where: getFiltersForOTPQuery(inputs, userOperatorIds),
    _count: {
      timetable_id: true,
    },
  })

  inputs.state = 'OnTime';
  const otpOnTimeRecords = await db.prisma.timetable.groupBy({
    by:['operator_noc'],
    where: getFiltersForOTPQuery(inputs, userOperatorIds),
    _count: {
      timetable_id: true,
    },
  })

  inputs.state = null;
  inputs.departureNullCheck = true;
  const completedRecords = await db.prisma.timetable.groupBy({
    by:['operator_noc'],
    where: getFiltersForOTPQuery(inputs, userOperatorIds),
    _count: {
      timetable_id: true,
    },
  })

  for (let i = 0; i < operators.length; i++) {
        const otpEarlyRecord = otpEarlyRecords.filter(o => o.operator_noc == operators[i].nocCode);
        const otpLateRecord = otpLateRecords.filter(o => o.operator_noc == operators[i].nocCode);
        const otpOnTimeRecord = otpOnTimeRecords.filter(o => o.operator_noc == operators[i].nocCode);
        const otpCompletedRecord = completedRecords.filter(o => o.operator_noc == operators[i].nocCode);

        let earlyCount, lateCount, onTimeCount, completed, scheduled = 0;
        
        if(otpEarlyRecord && otpEarlyRecord.length > 0){
          earlyCount = otpEarlyRecord[0]._count.timetable_id;
        }

        if(otpLateRecord && otpLateRecord.length > 0){
          lateCount = otpLateRecord[0]._count.timetable_id;
        }

        if(otpOnTimeRecord && otpOnTimeRecord.length > 0){
          onTimeCount = otpOnTimeRecord[0]._count.timetable_id;
        }

        if(otpCompletedRecord && otpCompletedRecord.length > 0){
          completed = otpCompletedRecord;
        }

        scheduled = earlyCount + lateCount + onTimeCount;
    
        let opPerformance: OperatorPerformanceType = {
          nocCode: operators[i].nocCode,
          operatorId: operators[i].nocCode,
          name: operators[i].name,
          early: earlyCount,
          late: lateCount,
          onTime: onTimeCount,
          averageDelay: 0, // TODO
          scheduledDepartures: scheduled,
          actualDepartures: completed
        }
        opPerformances.push(opPerformance)
    }

  var ret = {
    items: opPerformances,
    pageInfo: {
      next: opPerformances.length,
      totalCount: opPerformances.length
    }
  }
  return (ret)

  } catch (error) {
    console.log(error)
    return null;
  }
}

const dayOfWeek: DayCount[] = Array.from({length: 7}, (_, i) => ({
  dayOfWeek: i+1,
  early: 0,
  late: 0,
  onTime: 0
}))


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

          inputs.state = 'Early';
          const earlyOtpRecords = await db.prisma.timetable.groupBy({
            by:['day_of_week'],
            where: getFiltersForOTPQuery(inputs, operatorIds),
            _count: {
              timetable_id: true,
            },
          })

          inputs.state = 'Late';
          const lateOtpRecords = await db.prisma.timetable.groupBy({
            by:['day_of_week'],
            where: getFiltersForOTPQuery(inputs, operatorIds),
            _count: {
              timetable_id: true,
            },
          })

          inputs.state = 'OnTime';
          const onTimeOtpRecords = await db.prisma.timetable.groupBy({
            by:['day_of_week'],
            where: getFiltersForOTPQuery(inputs, operatorIds),
            _count: {
              timetable_id: true,
            },
          })

          earlyOtpRecords.forEach(otpRecord => {
            if(otpRecord.day_of_week){
             dayOfWeek[otpRecord.day_of_week].early += otpRecord._count.timetable_id
            }
          });

          lateOtpRecords.forEach(otpRecord => {
            if(otpRecord.day_of_week){
             dayOfWeek[otpRecord.day_of_week].late += otpRecord._count.timetable_id
            }
          });

          onTimeOtpRecords.forEach(otpRecord => {
            if(otpRecord.day_of_week){
             dayOfWeek[otpRecord.day_of_week].onTime += otpRecord._count.timetable_id
            }
          });
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

interface delayFrequencyRecord {
  bucket: number,
  frequency: number
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
    let UnRoundedDelaysBuckets: delayFrequencyRecord[] = [];
    let finalDelaysBuckets: delayFrequencyRecord[] = [];

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

          const otpRecords = await db.prisma.timetable.groupBy({
            by:['time_difference'],
            where: getFiltersForOTPQuery(inputs, operatorIds),
            _count: {
              timetable_id: true,
            },
          })

          console.log("getDelayFrequency count records: " + otpRecords.length)

          otpRecords.forEach(otpRecord => {
            if(otpRecord.time_difference){
              UnRoundedDelaysBuckets.push({
                bucket: otpRecord.time_difference,
                frequency: otpRecord._count.timetable_id
              })
            }
          });
        }

        UnRoundedDelaysBuckets.forEach(bucket => {
          const res = divideAndRound(bucket.bucket);

          //const delayBucket = delaysBuckets.find(d=>d.bucket = res)
          const index = delaysBuckets.findIndex(d=>d.bucket == res)
          if(index !== -1)
            {
              const freq = delaysBuckets.find(d=>d.bucket == res)
              delaysBuckets.splice(index, 1);
              delaysBuckets.push({
                bucket: res,
                frequency: freq?.frequency ? freq?.frequency + bucket.frequency : bucket.frequency
              })
            }
          else  {
              delaysBuckets.push({
                bucket: res,
                frequency: bucket.frequency
              })
            }
        });

        let frequencyThreshold = 10;
        if(lineIds && lineIds.length > 0)
          {
            frequencyThreshold = 0;
          }

        for (let index = 0; index < delaysBuckets.length; index++) {
          const element = delaysBuckets[index];

          if(element.frequency > frequencyThreshold){
            finalDelaysBuckets.push(element)
          }
        }
      }
      console.log("getDelayFrequency normalised to : " + finalDelaysBuckets.length)
    

    return finalDelaysBuckets;
  } catch (error) {
    console.log(error)
    return null;
  }
}

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

          inputs.state = 'Early';
          const earlyOtpRecords = await db.prisma.timetable.groupBy({
            by:['actual_departure_time'],
            where: getFiltersForOTPQuery(inputs, operatorIds),
            _count: {
              timetable_id: true,
            },
          })

          inputs.state = 'Late';
          const lateOtpRecords = await db.prisma.timetable.groupBy({
            by:['actual_departure_time'],
            where: getFiltersForOTPQuery(inputs, operatorIds),
            _count: {
              timetable_id: true,
            },
          })

          inputs.state = 'OnTime';
          const onTimeOtpRecords = await db.prisma.timetable.groupBy({
            by:['actual_departure_time'],
            where: getFiltersForOTPQuery(inputs, operatorIds),
            _count: {
              timetable_id: true,
            },
          })

          console.log("getPunctualityTimeOfDay early count records: " + earlyOtpRecords.length)

          earlyOtpRecords.forEach(otpRecord => {
            if(otpRecord.actual_departure_time){
             const roundedHour = roundToNearestHour(otpRecord.actual_departure_time);
             hoursOfDay[roundedHour].early += otpRecord._count.timetable_id
            }
          });

          lateOtpRecords.forEach(otpRecord => {
            if(otpRecord.actual_departure_time){
             const roundedHour = roundToNearestHour(otpRecord.actual_departure_time);
             hoursOfDay[roundedHour].late += otpRecord._count.timetable_id
            }
          });

          onTimeOtpRecords.forEach(otpRecord => {
            if(otpRecord.actual_departure_time){
             const roundedHour = roundToNearestHour(otpRecord.actual_departure_time);
             hoursOfDay[roundedHour].onTime += otpRecord._count.timetable_id
            }
          });
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

        const start = new Date(fromTimestamp);
        const end = new Date(toTimestamp);
        const days = getDaysInRange(start, end)

        const summary = days.map(date=> ({
          ts: date.toISOString(), 
          early: 0,
          late: 0,
          onTime: 0
        }))

        const dateToSummary = []
        summary.forEach(daySummary => {
          const dateKey = daySummary.ts.split('T')[0]
          dateToSummary[dateKey] = daySummary;
        })

        //console.log("getPunctualityTimeSeries: executing groupBy statement")

        inputs.state = 'Early';
        const otpEarlyRecords = await db.prisma.timetable.groupBy({
          by:['date_of_journey'],
          where: getFiltersForOTPQuery(inputs, operatorIds),
          _count: {
            timetable_id: true,
          },
        })

        inputs.state = 'Late';
        const otpLateRecords = await db.prisma.timetable.groupBy({
          by:['date_of_journey'],
          where: getFiltersForOTPQuery(inputs, operatorIds),
          _count: {
            timetable_id: true,
          },
        })

        inputs.state = 'OnTime';
        const otpOnTimeRecords = await db.prisma.timetable.groupBy({
          by:['date_of_journey'],
          where: getFiltersForOTPQuery(inputs, operatorIds),
          _count: {
            timetable_id: true,
          },
        })

        otpOnTimeRecords.forEach(otpOnTimeRecord => {
          if(otpOnTimeRecord.date_of_journey)
            {
              const dateOfJourney = otpOnTimeRecord.date_of_journey.toISOString().split('T')[0];
              if(dateOfJourney in dateToSummary) {
                const daySymmary = dateToSummary[dateOfJourney];
                daySymmary.onTime = otpOnTimeRecord._count.timetable_id;
              }
            }
        });

        otpLateRecords.forEach(otpLateRecord => {
          if(otpLateRecord.date_of_journey)
            {
              const dateOfJourney = otpLateRecord.date_of_journey.toISOString().split('T')[0];
              if(dateOfJourney in dateToSummary) {
                const daySymmary = dateToSummary[dateOfJourney];
                daySymmary.late = otpLateRecord._count.timetable_id;
              }
            }
        });

        otpEarlyRecords.forEach(otpEarlyRecord => {
          if(otpEarlyRecord.date_of_journey)
            {
              const dateOfJourney = otpEarlyRecord.date_of_journey.toISOString().split('T')[0];
              if(dateOfJourney in dateToSummary) {
                const daySymmary = dateToSummary[dateOfJourney];
                daySymmary.early = otpEarlyRecord._count.timetable_id;
              }
            }
        });

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

            const otpRecords = await db.prisma.timetable.findMany({
              where: getFiltersForOTPQuery(inputs, operatorIds),
              select:{
                timetable_id: true,
                service_code: true,
                line_name: true,
                stop_id: true,
                common_name: true,
                stop_longitude: true,
                stop_latitude: true,
                locality_id: true,
                is_timing_point: true,
                otp_state: true,
                actual_departure_time: true,
                expected_departure_time: true,
                time_difference: true
              }
            })

            console.log("getStopPerformance found otprecords for line: " + JSON.stringify(lineIds) + " " + otpRecords.length)

            for (let i = 0; i < otpRecords.length; i++) {
              const otpRecord = otpRecords[i];
              
              // get the index of this service in stop performances
              const index = stopPerformances.findIndex(s=>s.stopId == otpRecord.stop_id)
              if(index !== -1)
                {
                  // this service is in the stopPerformances arr, update it
                  if(otpRecord.otp_state)
                    {
                      switch (otpRecord.otp_state) {
                        case 'OnTime':
                          stopPerformances[index].onTime += 1;
                          break;
                        case 'Late':
                          stopPerformances[index].late += 1;
                          break;
                        case 'Early':
                          stopPerformances[index].early += 1;
                          break;
                        default:
                          break;
                      }
                    }

                  stopPerformances[index].scheduledDepartures += 1;

                  if(otpRecord.actual_departure_time)
                  {
                    stopPerformances[index].actualDepartures += 1;
                  }
                }
                else{
                  // create a new entry in stopperformances
                  let early: number = 0, late: number = 0, ontime: number = 0, actualDepartures: number = 0

                  if(otpRecord.actual_departure_time)
                    {
                      actualDepartures = 1;
                    }

                    if(otpRecord.otp_state)
                    {
                      switch (otpRecord.otp_state) {
                        case 'OnTime':
                          ontime += 1;
                          break;
                        case 'Late':
                          late += 1;
                          break;
                        case 'Early':
                          early += 1;
                          break;
                        default:
                          break;
                      }
                    }

                  

                  stopPerformances.push({
                    lineId: otpRecord.service_code,
                    stopId: otpRecord.stop_id? otpRecord.stop_id : 0,
                    stopInfo: {
                      stopId: otpRecord.stop_id? otpRecord.stop_id : 0,
                      stopName: otpRecord.common_name? otpRecord.common_name : "",
                      stopLocality: {
                        localityId: otpRecord.locality_id? otpRecord.locality_id : "",
                        localityName: "",
                        localityAreaId: "",
                        localityAreaName: ""
                      },
                      sourceId: "",
                      stopLocation: {
                        longitude: otpRecord.stop_longitude ? Number(otpRecord.stop_longitude):0 ,
                        latitude: otpRecord.stop_latitude ? Number(otpRecord.stop_latitude): 0
                      }
                    },
                    early: early,
                    late: late,
                    onTime: ontime,
                    actualDepartures: actualDepartures,
                    scheduledDepartures: 1,
                    averageDelay: 0,
                    timingPoint: otpRecord.is_timing_point? otpRecord.is_timing_point : false
                  })
                }

            }
          }
        }

  return stopPerformances;
  //   {
  //     lineId: "L100",
  //     stopId: "S100",
  //     early: 50,
  //     onTime: 250,
  //     late: 20,
  //     averageDelay: 1.5,
  //     scheduledDepartures: 320,
  //     actualDepartures: 310,
  //     timingPoint: true,
  //     stopIndex: 1,
  //     stopInfo: { // naptan data
  //       stopId: "S100",
  //       sourceId: "Source1", // naptan data
  //       stopName: "Central Station", // naptan data
  //       stopLocation: {
  //         latitude: 34.0522, // naptan data
  //         longitude: -118.2437 // naptan data
  //       },
  //       stopLocality: {
  //         localityId: "Loc100", // naptan data
  //         localityName: "Downtown", // naptan data
  //         localityAreaId: "Area100", // naptan data
  //         localityAreaName: "Central Area" // naptan data
  //       }
  //     }
  //   }
  // ];
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

              inputs.state = 'Early';
              const otpEarlyRecords = await db.prisma.timetable.groupBy({
                by:['service_code'],
                where: getFiltersForOTPQuery(inputs, operatorIds),
                _count: {
                  timetable_id: true,
                },
              })
      
              inputs.state = 'Late';
              const otpLateRecords = await db.prisma.timetable.groupBy({
                by:['service_code'],
                where: getFiltersForOTPQuery(inputs, operatorIds),
                _count: {
                  timetable_id: true,
                },
              })
      
              inputs.state = 'OnTime';
              const otpOnTimeRecords = await db.prisma.timetable.groupBy({
                by:['service_code'],
                where: getFiltersForOTPQuery(inputs, operatorIds),
                _count: {
                  timetable_id: true,
                },
              })

              inputs.state = null;
              inputs.departureNullCheck = true;
              const completedRecords = await db.prisma.timetable.groupBy({
                by:['service_code'],
                where: getFiltersForOTPQuery(inputs, userOperatorIds),
                _count: {
                  timetable_id: true,
                },
              })

              completedRecords.forEach(otpRecord => {
                let servicePunctualityRecord = servicePunctualities.find(s=>s.lineId == otpRecord.service_code);
                if(servicePunctualityRecord)
                {
                  servicePunctualityRecord.actualDepartures = otpRecord._count.timetable_id;
                }
                else{
                  let newServicePunctuality = {
                    lineId: otpRecord.service_code as string,
                    early: otpRecord._count.timetable_id,
                    late:0,
                    onTime:0,
                    lineInfo: {
                      serviceId: otpRecord.service_code as string,
                      serviceNumber: otpRecord.service_code as string,
                      serviceName: otpRecord.service_code as string
                    },
                    operatorInfo: {
                      operatorName: "ACYM",
                      nocCode: "ACYM",
                      operatorId: "ACYM"
                    },
                    averageDelay: 0,
                    scheduledDepartures: 0,
                    actualDepartures: otpRecord._count.timetable_id,
                    rank: 1
                  }
                  servicePunctualities.push(newServicePunctuality);
                }
              });

              otpEarlyRecords.forEach(otpRecord => {
                let servicePunctualityRecord = servicePunctualities.find(s=>s.lineId == otpRecord.service_code);
                if(servicePunctualityRecord)
                {
                  servicePunctualityRecord.early = otpRecord._count.timetable_id;
                  servicePunctualityRecord.scheduledDepartures = servicePunctualityRecord.scheduledDepartures + otpRecord._count.timetable_id;
                }
                else{
                  let newServicePunctuality = {
                    lineId: otpRecord.service_code as string,
                    early: otpRecord._count.timetable_id,
                    late:0,
                    onTime:0,
                    lineInfo: {
                      serviceId: otpRecord.service_code as string,
                      serviceNumber: otpRecord.service_code as string,
                      serviceName: otpRecord.service_code as string
                    },
                    operatorInfo: {
                      operatorName: "ACYM",
                      nocCode: "ACYM",
                      operatorId: "ACYM"
                    },
                    averageDelay: 0,
                    scheduledDepartures: otpRecord._count.timetable_id,
                    actualDepartures: 0,
                    rank: 1
                  }
                  servicePunctualities.push(newServicePunctuality);
                }
              });
              

              otpLateRecords.forEach(otpRecord => {
                let servicePunctualityRecord = servicePunctualities.find(s=>s.lineId == otpRecord.service_code);
                if(servicePunctualityRecord)
                {
                  servicePunctualityRecord.late = otpRecord._count.timetable_id;
                  servicePunctualityRecord.scheduledDepartures = servicePunctualityRecord.scheduledDepartures + otpRecord._count.timetable_id;
                }
                else{
                  let newServicePunctuality = {
                    lineId: otpRecord.service_code as string,
                    early: 0,
                    late:otpRecord._count.timetable_id,
                    onTime:0,
                    lineInfo: {
                      serviceId: otpRecord.service_code as string,
                      serviceNumber: otpRecord.service_code as string,
                      serviceName: otpRecord.service_code as string
                    },
                    operatorInfo: {
                      operatorName: "ACYM",
                      nocCode: "ACYM",
                      operatorId: "ACYM"
                    },
                    averageDelay: 0,
                    scheduledDepartures: otpRecord._count.timetable_id,
                    actualDepartures: 0,
                    rank: 1
                  }
                  servicePunctualities.push(newServicePunctuality);
                }
              });
      
              otpOnTimeRecords.forEach(otpRecord => {
                let servicePunctualityRecord = servicePunctualities.find(s=>s.lineId == otpRecord.service_code);
                if(servicePunctualityRecord)
                {
                  servicePunctualityRecord.onTime = otpRecord._count.timetable_id;
                  servicePunctualityRecord.scheduledDepartures = servicePunctualityRecord.scheduledDepartures + otpRecord._count.timetable_id;
                }
                else{
                  let newServicePunctuality = {
                    lineId: otpRecord.service_code as string,
                    early: 0,
                    late:0,
                    onTime:otpRecord._count.timetable_id,
                    lineInfo: {
                      serviceId: otpRecord.service_code as string,
                      serviceNumber: otpRecord.service_code as string,
                      serviceName: otpRecord.service_code as string
                    },
                    operatorInfo: {
                      operatorName: "ACYM",
                      nocCode: "ACYM",
                      operatorId: "ACYM"
                    },
                    averageDelay: 0,
                    scheduledDepartures: otpRecord._count.timetable_id,
                    actualDepartures:0,
                    rank: 1
                  }
                  servicePunctualities.push(newServicePunctuality);
                }
              });
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
      const adminAreas = await db.prisma.naptan_adminarea_with_shape.findMany({
        where: {
          id:{
            in: adminareaIds
          }
        }
      })

      if(!adminAreas){
        throw("No admin areas found")
      }

      const ret = adminAreas.map(adminArea => {
        return{
          adminAreaId: String(adminArea.id),
          adminAreaName:adminArea.name, 
          shape: adminArea.st_asgeojson
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
  if(dayOfWeekFlags.monday==true) dayOfWeekNumbers.push(1)
  if(dayOfWeekFlags.tuesday==true) dayOfWeekNumbers.push(2) 
  if(dayOfWeekFlags.wednesday==true) dayOfWeekNumbers.push(3)
  if(dayOfWeekFlags.thursday==true) dayOfWeekNumbers.push(4)
  if(dayOfWeekFlags.friday==true) dayOfWeekNumbers.push(5)
  if(dayOfWeekFlags.saturday==true) dayOfWeekNumbers.push(6)
  if(dayOfWeekFlags.sunday==true) dayOfWeekNumbers.push(7)
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
  if(tempNocList.length > 10){
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00.000+01:00`
    const tommorrowString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 1).padStart(2, '0')}T00:00:00.000+01:00`
    fromTimestamp = todayString;
    toTimestamp = tommorrowString;
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