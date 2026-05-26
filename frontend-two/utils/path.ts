export const stripTrailingSlashes = (path: string): string => {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

export const normalizePathname = (urlPath: string): string => {
  const [pathOnly] = urlPath.split(/[?#]/, 1);
  return stripTrailingSlashes(pathOnly || "/");
};
