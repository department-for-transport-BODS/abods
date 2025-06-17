import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ViewDistancesComponent } from "./view-distances.component";

describe("ViewDistancesComponent", () => {
  let component: ViewDistancesComponent;
  let fixture: ComponentFixture<ViewDistancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewDistancesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewDistancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
