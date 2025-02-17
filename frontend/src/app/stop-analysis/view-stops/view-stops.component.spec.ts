import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ViewStopsComponent } from "./view-stops.component";

describe("ViewStopsComponent", () => {
  let component: ViewStopsComponent;
  let fixture: ComponentFixture<ViewStopsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewStopsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewStopsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
