import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PrivacyPolicyComponent } from "./privacy-policy.component";
import { LayoutModule } from "../layout/layout.module";
import { SharedModule } from "../shared/shared.module";

describe("PrivacyPolicyComponent", () => {
  let component: PrivacyPolicyComponent;
  let fixture: ComponentFixture<PrivacyPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrivacyPolicyComponent],
      imports: [LayoutModule, SharedModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacyPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
