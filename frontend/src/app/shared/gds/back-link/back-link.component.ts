import { Component, Input } from '@angular/core';
import { ActivatedRoute, Params, QueryParamsHandling } from '@angular/router';

@Component({
  selector: 'gds-back-link',
  template: `
    <a
      *ngIf="hasParentOrRouterLink"
      class="govuk-back-link back-link govuk-!-margin-bottom-0"
      [routerLink]="route || ['..']"
      [queryParams]="queryParams"
      [queryParamsHandling]="queryParamsHandling"
      >{{ label }}</a
    >
  `,
  styleUrls: ['./back-link.component.scss'],
})
export class BackLinkComponent {
  @Input() label?: string;
  @Input() route?: string[];
  @Input() queryParams?: Params | null;
  @Input() queryParamsHandling?: QueryParamsHandling | null;

  constructor(private activatedRoute: ActivatedRoute) {}

  get hasParentOrRouterLink() {
    return this.activatedRoute.parent !== null || !!this.route;
  }
}
