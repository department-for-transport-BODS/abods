import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { ChipComponent } from "./chip.component";
import { SvgIconComponent } from "angular-svg-icon";
import { SharedModule } from "../../shared.module";

describe("ChipComponent", () => {
  let component: ChipComponent;
  let fixture: ComponentFixture<ChipComponent>;
  let buttonEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [ChipComponent, SvgIconComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChipComponent);
    component = fixture.componentInstance;
    buttonEl = fixture.debugElement.query(By.css(".chip__close"));
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit on close", () => {
    spyOn(component.closeChip, "emit");
    buttonEl.triggerEventHandler("click", null);

    expect(component.closeChip.emit).toHaveBeenCalledWith();
  });
});
