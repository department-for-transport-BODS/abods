// Class for reusable functionality - date handlers, regex utilities, etc.
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
