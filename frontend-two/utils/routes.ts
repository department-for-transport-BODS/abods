export const PUBLIC_ROUTES = [
  "/login",
  "/404",
  "/500",
  "/accessibility",
  "/cookies",
  "/privacy-policy",
  "/version",
];

export const isPublicRoute = (path: string): boolean => {
  const normalizedPath = path.split("?")[0].replace(/\/+$/, "") || "/";
  return PUBLIC_ROUTES.some(
    (route) => normalizedPath === route || normalizedPath.endsWith(route),
  );
};
