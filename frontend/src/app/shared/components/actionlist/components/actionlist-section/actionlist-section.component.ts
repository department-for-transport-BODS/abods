import { Component, Input } from '@angular/core';
/* eslint-disable @angular-eslint/component-selector */
@Component({
  selector: '[app-actionlist-section]',
  templateUrl: './actionlist-section.component.html',
  styleUrls: ['./actionlist-section.component.scss'],
})
export class ActionListSectionComponent {
  @Input() title = '';
}
