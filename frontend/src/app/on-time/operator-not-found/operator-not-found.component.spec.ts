import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OperatorNotFoundComponent } from "./operator-not-found.component";
import { LayoutModule } from "../../layout/layout.module";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { SharedModule } from "../../shared/shared.module";

describe("OperatorNotFoundComponent", () => {
  let component: OperatorNotFoundComponent;
  let fixture: ComponentFixture<OperatorNotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OperatorNotFoundComponent],
      imports: [LayoutModule, RouterModule, SharedModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {},
            },
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OperatorNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
