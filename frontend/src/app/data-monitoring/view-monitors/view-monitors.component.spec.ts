import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ViewMonitorsComponent } from "./view-monitors.component";

describe("ViewMonitorsComponent", () => {
  let component: ViewMonitorsComponent;
  let fixture: ComponentFixture<ViewMonitorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewMonitorsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewMonitorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
