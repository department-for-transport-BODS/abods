import { Duration } from 'luxon';
import { FormatDurationPipe } from './format-duration.pipe';

describe('Pipe: FormatDuratione', () => {
  let pipe: FormatDurationPipe;

  beforeEach(() => {
    pipe = new FormatDurationPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should add a negative sign if duration is negative', () => {
    expect(pipe.transform(Duration.fromObject({ minute: -1, second: -1 }), 'm:ss')).toEqual('-1:01');
  });

  it('should not add a negative sign if duration is positive', () => {
    expect(pipe.transform(Duration.fromObject({ minute: 1, second: 1 }), 'm:ss')).toEqual('1:01');
  });

  it('should not add a negative sign if duration is 0', () => {
    expect(pipe.transform(Duration.fromObject({ minute: 0, second: 0 }), 'm:ss')).toEqual('0:00');
  });

  it('should add a negative sign if duration is negative and format includes negative sign', () => {
    expect(pipe.transform(Duration.fromObject({ minute: -1, second: 0 }), '-hh:mm:ss')).toEqual('--00:01:00');
  });

  it('should add a positive prefix if set and duration is positive', () => {
    expect(pipe.transform(Duration.fromObject({ minute: 1, second: 0 }), 'hh:mm:ss', '+')).toEqual('+00:01:00');
  });

  it('should add a positive prefix if set and duration is positive and format includes negative sign', () => {
    expect(pipe.transform(Duration.fromObject({ minute: 1, second: 0 }), '+hh:mm:ss', '+')).toEqual('++00:01:00');
  });

  it('should not add a positive sign if duration is 0', () => {
    expect(pipe.transform(Duration.fromObject({ minute: 0, second: 0 }), 'm:ss', '+')).toEqual('0:00');
  });
});
