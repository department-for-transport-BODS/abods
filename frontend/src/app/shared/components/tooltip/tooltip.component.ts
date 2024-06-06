import { Component, OnInit, Input, ViewEncapsulation, TemplateRef } from '@angular/core';
import { NgxTippyProps, NgxTippyService } from 'ngx-tippy-wrapper';
import type { Placement } from 'tippy.js';

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TooltipComponent implements OnInit {
  @Input() message?: string | TemplateRef<any> | null = '';
  @Input() identifier?: string;
  @Input() position?: Placement;
  @Input() underline? = false;
  @Input() selectable? = false;

  tippyProps: NgxTippyProps = {
    allowHTML: true,
    theme: 'gds-tooltip',
    zIndex: 100,
  };

  constructor(private ngxTippyService: NgxTippyService) {}

  ngOnInit(): void {
    this.setContentForTooltip();
    this.setPositionForTooltip();
  }

  setContentForTooltip() {
    this.tippyProps.content = this.message as string;
  }
  setPositionForTooltip() {
    this.tippyProps.placement = this.position || 'top';
  }

  get tooltipClasses() {
    return {
      'unbuttoned tooltip': true,
      [`tooltip--underline`]: this.underline,
      [`tooltip--selectable`]: this.selectable,
    };
  }
}
