import { DistancePipe } from './distance.pipe';

describe('DistancePipe', () => {
  let pipe: DistancePipe;

  beforeEach(() => {
    pipe = new DistancePipe('en_GB');
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should convert m to m', () => {
    expect(pipe.transform(100, 'm', 'm')).toEqual('100');
  });

  it('should convert m to km', () => {
    expect(pipe.transform(100, 'm', 'km')).toEqual('0.1');
  });

  it('should convert m to mi', () => {
    expect(pipe.transform(100, 'm', 'mi')).toEqual('0.062');
  });

  it('should convert m to yd', () => {
    expect(pipe.transform(100, 'm', 'yd')).toEqual('109.361');
  });

  it('should convert km to m', () => {
    expect(pipe.transform(100, 'km', 'm')).toEqual('100,000');
  });

  it('should convert km to km', () => {
    expect(pipe.transform(100, 'km', 'km')).toEqual('100');
  });

  it('should convert km to mi', () => {
    expect(pipe.transform(100, 'km', 'mi')).toEqual('62.137');
  });

  it('should convert km to yd', () => {
    expect(pipe.transform(100, 'km', 'yd')).toEqual('109,361.33');
  });

  it('should convert mi to m', () => {
    expect(pipe.transform(100, 'mi', 'm')).toEqual('160,934.4');
  });

  it('should convert mi to km', () => {
    expect(pipe.transform(100, 'mi', 'km')).toEqual('160.934');
  });

  it('should convert mi to mi', () => {
    expect(pipe.transform(100, 'mi', 'mi')).toEqual('100');
  });

  it('should convert mi to yd', () => {
    expect(pipe.transform(100, 'mi', 'yd')).toEqual('176,000');
  });

  it('should convert yd to m', () => {
    expect(pipe.transform(100, 'yd', 'm')).toEqual('91.44');
  });

  it('should convert yd to km', () => {
    expect(pipe.transform(100, 'yd', 'km')).toEqual('0.091');
  });

  it('should convert yd to mi', () => {
    expect(pipe.transform(100, 'yd', 'mi')).toEqual('0.057');
  });

  it('should convert yd to yd', () => {
    expect(pipe.transform(100, 'yd', 'yd')).toEqual('100');
  });

  it('should support string value', () => {
    expect(pipe.transform('100', 'm', 'km')).toEqual('0.1');
  });

  it('should return null for NaN', () => {
    expect(pipe.transform(Number.NaN, 'm', 'km')).toEqual(null);
  });

  it('should return null for null', () => {
    expect(pipe.transform(null, 'm', 'km')).toEqual(null);
  });

  it('should return null for undefined', () => {
    expect(pipe.transform(undefined, 'm', 'km')).toEqual(null);
  });

  it('should not support other objects', () => {
    expect(() => pipe.transform({} as any, 'm', 'm')).toThrow(
      `InvalidPipeArgument Error: [object Object] is not a number for pipe 'DistancePipe'`
    );

    expect(() => pipe.transform('123abc', 'km', 'km')).toThrow(
      `InvalidPipeArgument Error: 123abc is not a number for pipe 'DistancePipe'`
    );
  });

  it('should return custom digit and decimal representation', () => {
    expect(pipe.transform(100, 'm', 'mi', '3.1-6')).toEqual('000.062137');
  });

  it('should not add a unit', () => {
    expect(pipe.transform(100, 'm', 'm', '', 'none')).toEqual('100');
  });

  it('should add m unit', () => {
    expect(pipe.transform(100, 'm', 'm', '', 'short')).toEqual('100m');
  });

  it('should add meter unit if value is 1', () => {
    expect(pipe.transform(1, 'm', 'm', '', 'long')).toEqual('1 meter');
  });

  it('should add meters unit', () => {
    expect(pipe.transform(100, 'm', 'm', '', 'long')).toEqual('100 meters');
  });

  it('should add km unit', () => {
    expect(pipe.transform(100, 'km', 'km', '', 'short')).toEqual('100km');
  });

  it('should add kilometer unit if value is 1', () => {
    expect(pipe.transform(1, 'km', 'km', '', 'long')).toEqual('1 kilometer');
  });

  it('should add kilometers unit', () => {
    expect(pipe.transform(100, 'km', 'km', '', 'long')).toEqual('100 kilometers');
  });

  it('should add mi unit', () => {
    expect(pipe.transform(100, 'mi', 'mi', '', 'short')).toEqual('100mi');
  });

  it('should add mile unit if value is 1', () => {
    expect(pipe.transform(1, 'mi', 'mi', '', 'long')).toEqual('1 mile');
  });

  it('should add miles unit', () => {
    expect(pipe.transform(100, 'mi', 'mi', '', 'long')).toEqual('100 miles');
  });

  it('should add yd unit', () => {
    expect(pipe.transform(100, 'yd', 'yd', '', 'short')).toEqual('100yd');
  });

  it('should add yard unit if value is 1', () => {
    expect(pipe.transform(1, 'yd', 'yd', '', 'long')).toEqual('1 yard');
  });

  it('should add yards unit', () => {
    expect(pipe.transform(100, 'yd', 'yd', '', 'long')).toEqual('100 yards');
  });

  it('should round up so that we never show a positive distance as 0', () => {
    expect(pipe.transform(10, 'm', 'mi', '1.1-1')).toEqual('0.1');
    expect(pipe.transform(100, 'm', 'mi', '3.1-5')).toEqual('000.06214');
  });

  it('should not round up if 0', () => {
    expect(pipe.transform(0, 'm', 'mi', '1.1-1')).toEqual('0.0');
  });
});
