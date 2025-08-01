import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AccessibilityComponent } from "./accessibility.component";
import { LayoutModule } from "../layout/layout.module";
import { SharedModule } from "../shared/shared.module";

describe("AccessibilityComponent", () => {
  let component: AccessibilityComponent;
  let fixture: ComponentFixture<AccessibilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccessibilityComponent],
      imports: [LayoutModule, SharedModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessibilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
