import { fakeAsync, flush, tick } from '@angular/core/testing';
import { Spectator, createComponentFactory } from '@ngneat/spectator';
import { NouisliderModule } from 'ng2-nouislider';

import { RangeSliderComponent } from './range-slider.component';

describe('SliderComponent', () => {
  let spectator: Spectator<RangeSliderComponent>;
  let component: RangeSliderComponent;

  const createComponent = createComponentFactory({
    component: RangeSliderComponent,
    imports: [NouisliderModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    component.min = 0;
    component.max = 10;
    spectator.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit lower value on change', fakeAsync(() => {
    component.onSliderChange([0, 10]);
    tick(1);

    spyOn(component.lowerChange, 'emit');
    spyOn(component.upperChange, 'emit');
    component.onSliderChange([5, 10]);
    tick(1);

    expect(component.lowerChange.emit).toHaveBeenCalledWith(5);
    expect(component.upperChange.emit).not.toHaveBeenCalled();
  }));

  it('should emit upper value on change', fakeAsync(() => {
    component.onSliderChange([0, 10]);
    tick(1);

    spyOn(component.lowerChange, 'emit');
    spyOn(component.upperChange, 'emit');
    component.onSliderChange([0, 8]);
    tick(1);

    expect(component.upperChange.emit).toHaveBeenCalledWith(8);
    expect(component.lowerChange.emit).not.toHaveBeenCalled();
  }));

  it('should emit upperStartLimit if value less than upperStartLimit on change', fakeAsync(() => {
    spyOn(component.upperChange, 'emit');

    component.upperStartLimit = 5;
    component.onSliderChange([0, 4]);
    tick(1);

    expect(component.upperChange.emit).toHaveBeenCalledWith(5);
    flush();
  }));

  it('should emit lowerEndLimit if value greater than lowerEndLimit on change', fakeAsync(() => {
    spyOn(component.lowerChange, 'emit');

    component.lowerEndLimit = 5;
    component.onSliderChange([6, 10]);
    tick(1);

    expect(component.lowerChange.emit).toHaveBeenCalledWith(5);
    flush();
  }));

  it('should not set value while sliding is true', () => {
    component.value = [0, 10];
    component.startSlide();
    component.lower = 2;
    component.upper = 8;

    expect(component.value).toEqual([0, 10]);
  });

  it('should set value while sliding is false', () => {
    component.value = [0, 10];
    component.endSlide();
    component.lower = 2;
    component.upper = 8;

    expect(component.value).toEqual([2, 8]);
  });
});
