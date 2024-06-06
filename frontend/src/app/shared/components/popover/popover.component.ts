import { Component, OnInit, ViewChild, ElementRef, Input, ViewEncapsulation } from '@angular/core';
import { NgxTippyProps, NgxTippyService } from 'ngx-tippy-wrapper';
import type { Placement } from 'tippy.js';

@Component({
  selector: 'app-popover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PopoverComponent implements OnInit {
  @Input() triggerLabel!: string;
  @Input() triggerIcon?: string;
  @Input() triggerType: 'button' | 'link' = 'link';
  @Input() identifier!: string;
  @Input() position?: Placement;

  @ViewChild('popoverContent', { read: ElementRef, static: true }) popoverContent!: ElementRef;

  tippyProps: NgxTippyProps = {
    trigger: 'click',
    allowHTML: true,
    interactive: true,
    theme: 'gds-popover',
    role: 'menu',
    zIndex: 90,
  };

  constructor(private ngxTippyService: NgxTippyService) {}

  ngOnInit(): void {
    this.setContentForPopover();
    this.setPositionForPopover();
  }

  setContentForPopover(): void {
    const template = this.popoverContent.nativeElement;
    this.tippyProps.content = template;
  }

  setPositionForPopover(): void {
    (this.tippyProps.placement = this.position || 'auto'),
      (this.tippyProps.offset = this.triggerType === 'button' ? [0, 30] : [0, 20]);
  }
}
