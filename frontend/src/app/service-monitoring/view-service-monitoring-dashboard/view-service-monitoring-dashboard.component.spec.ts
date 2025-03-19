import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ViewServiceMonitoringDashboardComponent } from "./view-service-monitoring-dashboard.component";

describe("ViewServiceMonitoringDashboardComponent", () => {
  let component: ViewServiceMonitoringDashboardComponent;
  let fixture: ComponentFixture<ViewServiceMonitoringDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewServiceMonitoringDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewServiceMonitoringDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
