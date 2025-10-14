import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChartNoDataWrapperComponent } from "./chart-no-data-wrapper.component";

fdescribe("ChartNoDataWrapperComponent", () => {
  let component: ChartNoDataWrapperComponent;
  let fixture: ComponentFixture<ChartNoDataWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChartNoDataWrapperComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartNoDataWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
