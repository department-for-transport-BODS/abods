import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtpLegendComponent } from './otp-legend.component';

describe('OtpLegendComponent', () => {
  let component: OtpLegendComponent;
  let fixture: ComponentFixture<OtpLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OtpLegendComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OtpLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
