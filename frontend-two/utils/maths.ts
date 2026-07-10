import { Maybe } from "../src/generated/graphql";

const isNotNullish = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

export const sumBy = <T>(items: T[], key: keyof T): number =>
  items.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);

export const stdDeviation = (
  arr: Maybe<number | null | undefined>[],
  meanValue: number,
): number =>
  Math.sqrt(
    mean(
      arr
        .filter(isNotNullish)
        .map((value) => Math.pow((value as number) - meanValue, 2)),
    ),
  );

export const formatPercentage = (ratio: number | null | undefined): string => {
  if (ratio == null) return "-";
  const percentage = Math.round(ratio * 1000) / 10;
  return `${Number.isInteger(percentage) ? percentage.toFixed(0) : percentage.toFixed(1)}%`;
};
