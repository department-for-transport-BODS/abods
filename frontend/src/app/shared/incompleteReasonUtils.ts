export const incompleteReasonText = {
  1: "missing NOC from real-time data",
  2: "missing service from real-time data",
  3: "missing journey code from real-time data",
  4: "missing real-time data within the zone of a stop",
  5: "GPS location in the zone of a stop that is deemed invalid",
  0: "an unspecified matching issue",
} as const;

export const incompleteIdToString = (incompleteId: number) =>
  incompleteReasonText[incompleteId as keyof typeof incompleteReasonText] ??
  incompleteReasonText[0];

export const incompleteConversion = (reasons: Record<number, number>) => {
  const reasonCounts: Record<string, number> = {};
  for (const incompleteId of Object.keys(incompleteReasonText)) {
    const properKey = Number(incompleteId) as keyof typeof incompleteReasonText;
    reasonCounts[incompleteIdToString(properKey)] = reasons[properKey];
  }
  return Object.entries(reasonCounts)
    .filter((n) => n[1])
    .map(([reason, count]) => ({ reason, count }));
};
