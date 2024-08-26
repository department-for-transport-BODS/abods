import { Component, EventEmitter, OnInit, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { DateTime } from 'luxon';
import { NgxTippyProps } from 'ngx-tippy-wrapper';

@Component({
  selector: 'app-datenav-item',
  templateUrl: './datenav-item.component.html',
  styleUrls: ['./datenav-item.component.scss'],
})
export class DatenavItemComponent implements OnInit {
  @Input() heat?: number;
  @Input() date?: DateTime;
  @Input() disabled?: boolean;
  @Input() active? = false;
  @Output() selectDate: EventEmitter<DateTime> = new EventEmitter<DateTime>();

  @ViewChild('navButton') button?: ElementRef;

  tippyProps: NgxTippyProps = {
    placement: 'top',
    theme: 'gds-tooltip',
    zIndex: 90,
  };

  ngOnInit(): void {
    this.tippyProps.content = this.date?.toFormat('d MMMM');
  }

  get firstOfTheMonth() {
    return this?.date?.day === 1;
  }

  get dateNavItemClasses() {
    return {
      'unbuttoned datenav__item': true,
      [`datenav__item--heat-${this.heat}`]: this.heat,
      'datenav__item--active': this.active,
      'datenav__item--month-start': this.firstOfTheMonth,
    };
  }
}
