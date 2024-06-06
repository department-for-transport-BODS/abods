import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { SharedModule } from '../../shared.module';
import { OtpParamRangeSliderComponent } from './otp-param-range-slider.component';

describe('OtpParamRangeSliderComponent', () => {
  let spectator: Spectator<OtpParamRangeSliderComponent>;
  let component: OtpParamRangeSliderComponent;

  const createComponent = createComponentFactory({
    component: OtpParamRangeSliderComponent,
    imports: [SharedModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    spectator.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit slider early value as positive number', () => {
    spyOn(component.earlyChange, 'emit');
    spyOn(component.lateChange, 'emit');
    component.sliderEarly = -5;

    expect(component.earlyChange.emit).toHaveBeenCalledWith(5);
    expect(component.lateChange.emit).not.toHaveBeenCalled();
  });

  it('should emit slider late value', () => {
    spyOn(component.lateChange, 'emit');
    spyOn(component.earlyChange, 'emit');
    component.sliderLate = 5;

    expect(component.lateChange.emit).toHaveBeenCalledWith(5);
    expect(component.earlyChange.emit).not.toHaveBeenCalled();
  });
});
