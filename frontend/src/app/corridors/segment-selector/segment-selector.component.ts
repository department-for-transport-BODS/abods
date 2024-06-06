import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';

import { NgxTippyProps } from 'ngx-tippy-wrapper';
import { filterServiceLinksByStops, Stop } from '../corridors.service';
import { ServiceLinkType } from '../../../generated/graphql';
import { isNotNullOrUndefined } from '../../shared/rxjs-operators';
import { pairwise } from '../../shared/array-operators';

export const enum ServiceLinkValidity {
  VALID = 'VALID',
}

@Component({
  selector: 'app-segment-selector',
  templateUrl: './segment-selector.component.html',
  styleUrls: ['./segment-selector.component.scss'],
})
export class SegmentSelectorComponent implements OnChanges, AfterViewInit {
  @Input() stops?: Stop[];
  @Input() serviceLinks?: ServiceLinkType[];
  @Input() isDisabled?: boolean;
  @Output() selectSegment = new EventEmitter<[Stop, Stop] | []>();
  @Output() deselectSegment = new EventEmitter<[Stop, Stop] | []>();
  @Output() mouseEnterStop = new EventEmitter<Stop>();
  @Output() mouseLeaveStop = new EventEmitter<Stop>();

  @ViewChild('scrollContent', { read: ElementRef }) scrollContent?: ElementRef<any>;

  selected?: [Stop, Stop];
  segments?: [Stop, Stop][];

  tippyProps: NgxTippyProps = {
    allowHTML: true,
    theme: 'gds-tooltip',
    zIndex: 100,
    placement: 'bottom',
  };

  get isServiceLinksLoaded(): boolean {
    return isNotNullOrUndefined(this.serviceLinks) && this.serviceLinks.length > 0;
  }

  get showScrollControls(): boolean {
    return this.scrollContent?.nativeElement.offsetWidth < this.scrollContent?.nativeElement.scrollWidth;
  }

  get scrollEl(): HTMLElement {
    return this.scrollContent?.nativeElement as HTMLElement;
  }

  get first(): boolean {
    return this.scrollEl.scrollLeft === 0;
  }

  get last(): boolean {
    return this.scrollEl.scrollLeft + this.scrollEl.offsetWidth === this.scrollEl.scrollWidth;
  }

  private readonly SEGMENT_MIN_WIDTH = 75;
  private readonly STOP_SIZE = 30;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnChanges() {
    this.segments = pairwise(this.stops ?? []);
  }

  ngAfterViewInit() {
    //Running to check for @ViewChild('scrollContent) element value changes
    this.cd.detectChanges();
  }

  onSelect(segment?: [Stop, Stop]) {
    this.deselectSegment.next(this.selected ?? []);
    this.selected = segment;
    this.selectSegment.emit(segment ?? []);
  }

  isSelected(segment: [Stop, Stop]): boolean {
    return this.selected?.[0].stopId === segment[0].stopId && this.selected?.[1].stopId === segment[1].stopId;
  }

  getSegmentDistance(segment: [Stop, Stop]): number | undefined {
    if (this.isServiceLinksLoaded) {
      return filterServiceLinksByStops(this.serviceLinks, segment).reduce((acc, val) => acc + val.distance, 0);
    }
  }

  isInvalidServiceLink(segment: [Stop, Stop]): boolean {
    if (this.isServiceLinksLoaded) {
      const link: ServiceLinkType = filterServiceLinksByStops(this.serviceLinks, segment)[0];
      return link ? link.routeValidity !== ServiceLinkValidity.VALID : false;
    }
    return false;
  }

  containsInvalidServiceLink(): boolean {
    const segment = this.segments?.find((segment) => this.isInvalidServiceLink(segment));
    return isNotNullOrUndefined(segment) ? true : false;
  }

  scrollRight() {
    this.scrollEl.scrollTo({
      left: this.scrollEl.scrollLeft + (this.scrollEl.offsetWidth - (this.SEGMENT_MIN_WIDTH + this.STOP_SIZE)),
      behavior: 'smooth',
    });
  }

  scrollLeft() {
    this.scrollEl.scrollTo({
      left: this.scrollEl.scrollLeft - (this.scrollEl.offsetWidth - (this.SEGMENT_MIN_WIDTH + this.STOP_SIZE)),
      behavior: 'smooth',
    });
  }
}
