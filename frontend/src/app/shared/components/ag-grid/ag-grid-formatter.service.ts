import { PercentPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Duration } from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class AgGridFormatterService {
  constructor(private percent: PercentPipe) {}

  percentValueFormatter = ({ value }: { value: number }) => this.percent.transform(value, '1.0-1') ?? '';
  averageDelayValueFormatter = ({ value }: { value: number }) => {
    const rounded = Math.round(value);
    return (rounded >= 0 ? '+' : '-') + Duration.fromObject({ seconds: Math.abs(rounded) }).toFormat('mm:ss');
  };
  averageDelayValueExportFormatter = ({ value }: { value: number }) => value.toFixed(0);
}
