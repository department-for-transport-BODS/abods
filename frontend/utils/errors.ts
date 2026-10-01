import { ErrorInfo } from "@/types";

export const buildTitle = (
  errors: ErrorInfo[] | undefined,
  title: string,
): string => {
  if (errors && errors.length > 0) {
    return `Error: ${title}`;
  }
  return title;
};
