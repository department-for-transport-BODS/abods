import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { NouisliderComponent } from 'ng2-nouislider';
import { Subject } from 'rxjs';
import { debounceTime, pairwise, startWith, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-range-slider',
  templateUrl: './range-slider.component.html',
  styleUrls: ['./range-slider.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class RangeSliderComponent implements OnInit, OnDestroy {
  @Input() min!: number;
  @Input() max!: number;
  @Input() connect: boolean[] = [false, true, false];
  @Input() lowerEndLimit?: number;
  @Input() upperStartLimit?: number;

  change = new Subject<[number, number]>();
  destroyed = new Subject<void>();

  sliding = false;

  value: [number, number] = [this.min, this.max];

  @ViewChild('nouislider') slider!: NouisliderComponent;

  onSliderChange(value: [number, number]) {
    if (this.lowerEndLimit && value[0] > this.lowerEndLimit) {
      value = [this.lowerEndLimit, value[1]];
      this.slider.writeValue(value);
    } else if (this.upperStartLimit && value[1] < this.upperStartLimit) {
      value = [value[0], this.upperStartLimit];
      this.slider.writeValue(value);
    }
    this.change.next(value);
  }

  @Input() set lower(val: number) {
    // Don't update value if user is sliding
    if (this.sliding) {
      return;
    }
    this.value = [val, this.value[1]];
  }
  @Output() lowerChange = new EventEmitter<number>();
  @Input() set upper(val: number) {
    // Don't update value if user is sliding
    if (this.sliding) {
      return;
    }
    this.value = [this.value[0], val];
  }
  @Output() upperChange = new EventEmitter<number>();

  ngOnInit(): void {
    this.change
      .pipe(debounceTime(1), startWith([NaN, NaN] as [number, number]), pairwise(), takeUntil(this.destroyed))
      .subscribe(([[oldLo, oldUp], [lo, up]]) => {
        if (oldLo !== lo) {
          this.lowerChange.emit(lo);
        }
        if (oldUp !== up) {
          this.upperChange.emit(up);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  startSlide() {
    this.sliding = true;
  }

  endSlide() {
    this.sliding = false;
  }
}
