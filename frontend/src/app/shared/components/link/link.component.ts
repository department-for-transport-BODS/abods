import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-link',
  template: `<a [routerLink]="route" [ngClass]="linkClasses">
    <span class="link__text"><ng-content></ng-content></span>
  </a>`,
  styleUrls: ['./link.component.scss'],
})
export class LinkComponent {
  @Input() route?: unknown[] | string;
  @Input() weight?: 'regular' | 'bold';
  @Input() arrows = false;
  @Input() underline = true; // set to false to hide underline when not selected

  get linkClasses() {
    return {
      'link govuk-link': true,
      'govuk-!-font-weight-bold': this.weight == 'bold',
      'link--with-arrows': this.arrows,
      'link--no-underline': !this.underline,
    };
  }
}
