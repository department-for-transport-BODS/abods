export const parseCorridorId = (
  value: string | string[] | undefined,
): number | null => {
  const corridorId = Array.isArray(value) ? value[0] : value;
  const parsed = Number(corridorId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const queryValue = (
  value: string | string[] | undefined,
): string | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? null;
};

export const getSearchParam = (
  value: string | string[] | undefined,
): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};
