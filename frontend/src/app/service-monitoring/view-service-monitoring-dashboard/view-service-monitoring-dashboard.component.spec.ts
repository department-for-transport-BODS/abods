import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ViewServiceMonitoringDashboardComponent } from "./view-service-monitoring-dashboard.component";
import { SharedModule } from "../../shared/shared.module";
import { LayoutModule } from "../../layout/layout.module";

describe("ViewServiceMonitoringDashboardComponent", () => {
  let component: ViewServiceMonitoringDashboardComponent;
  let fixture: ComponentFixture<ViewServiceMonitoringDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewServiceMonitoringDashboardComponent],
      imports: [SharedModule, LayoutModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewServiceMonitoringDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
