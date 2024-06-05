import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveVehicleStatsComponent } from './live-vehicle-stats.component';

describe('LiveVehicleStatsComponent', () => {
  let component: LiveVehicleStatsComponent;
  let fixture: ComponentFixture<LiveVehicleStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LiveVehicleStatsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LiveVehicleStatsComponent);
    component = fixture.componentInstance;
    component.dataSource = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
