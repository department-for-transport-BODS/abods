declare module "govuk-frontend" {
  export function initAll(config?: {
    scope?: HTMLElement | Document;
    onError?: (error: Error) => void;
  }): void;
}
