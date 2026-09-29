export const settle = async <T>(
  promise: Promise<T>,
): Promise<{ data: T | null; error: string | null }> => {
  try {
    return { data: await promise, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};
