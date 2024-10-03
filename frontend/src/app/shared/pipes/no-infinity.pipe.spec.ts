import { NoInfinityPipe } from './no-infinity.pipe';

describe('Pipe: NoInfinity', () => {
  let pipe: NoInfinityPipe;

  beforeEach(() => {
    pipe = new NoInfinityPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return NaN when value equals infinity', () => {
    expect(pipe.transform(Infinity)).toEqual(NaN);
  });

  it('should return value when not infinity', () => {
    expect(pipe.transform(5)).toEqual(5);
  });
});
