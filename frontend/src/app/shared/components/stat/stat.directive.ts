import { Directive, TemplateRef } from "@angular/core";

@Directive({
  selector: "ng-template[appStatTemplate]",
})
export class StatTemplateDirective<T> {
  static ngTemplateContextGuard<T>(
    _dir: StatTemplateDirective<T>,
    ctx: unknown,
  ): ctx is { value: T } {
    return typeof ctx === "object" && ctx !== null && "value" in ctx;
  }

  constructor(public template: TemplateRef<{ value: T }>) {}
}
