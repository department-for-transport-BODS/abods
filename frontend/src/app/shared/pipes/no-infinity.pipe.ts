import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'noInfinity' })
export class NoInfinityPipe implements PipeTransform {
  transform(value: number | null | undefined): number | null | undefined {
    return value === Infinity ? NaN : value;
  }
}
