import { Maybe } from "../src/generated/graphql";

const isNotNullish = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

export const sumBy = <T>(items: T[], key: keyof T): number =>
  items.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);

export const getRatio = (
  numerator: number | null | undefined,
  denominator: number | null | undefined,
): number => (denominator ? (numerator ?? 0) / denominator : 0);

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

// Angular formats grid percentages with `percent: '1.0-1'` and summary/panel
// percentages with `percent: '1.0-2'`; neither pads trailing zeros.
const gridPercentageFormatter = new Intl.NumberFormat("en-GB", {
  style: "percent",
  maximumFractionDigits: 1,
});

const precisePercentageFormatter = new Intl.NumberFormat("en-GB", {
  style: "percent",
  maximumFractionDigits: 2,
});

export const formatPercentage = (ratio: number | null | undefined): string =>
  ratio == null ? "-" : gridPercentageFormatter.format(ratio);

export const formatPrecisePercentage = (
  ratio: number | null | undefined,
): string => (ratio == null ? "-" : precisePercentageFormatter.format(ratio));
