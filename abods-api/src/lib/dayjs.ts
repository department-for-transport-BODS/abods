import dayjs, { Dayjs } from "dayjs"
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

export const getDate = (date?: string | Date | null, format?: string): Dayjs => {
    if(format){
        return dayjs(date, format)
    } if(date) {
        return dayjs(date)
    } else {
        return dayjs(new Date())
    }
}

export const getUTCDate = (date?: string | Date ): Dayjs => { 
    return dayjs.utc(date)  
}

export const parseTimetz = (timetzString: string): Dayjs => {
    const [timePart] = timetzString.split('+');
    const [time, timezone] = timePart.split(' ');
    const [hours, minutes, seconds] = time.split(':').map(Number);
  
    return dayjs().set('hour', hours).set('minute', minutes).set('second', seconds);
}
  