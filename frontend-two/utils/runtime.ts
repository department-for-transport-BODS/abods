const truthyValues = new Set(["1", "true", "yes", "on"]);

export const isApiBypassed = (): boolean => {
  const raw =
    process.env.NEXT_PUBLIC_DISABLE_API ?? process.env.NEXT_PUBLIC_OFFLINE_MODE;

  if (!raw) {
    return false;
  }

  return truthyValues.has(raw.toLowerCase());
};


