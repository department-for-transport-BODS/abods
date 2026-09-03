declare module "*.svg" {
  import { FC, SVGProps } from "react";
  const SVG: FC<SVGProps<SVGSVGElement>>;
  export default SVG;
}

declare module "govuk-frontend" {
  export function initAll(config?: {
    scope?: HTMLElement | Document;
    onError?: (error: Error) => void;
  }): void;

  export class Accordion {
    constructor($root: Element | null, config?: Record<string, unknown>);
  }
}
