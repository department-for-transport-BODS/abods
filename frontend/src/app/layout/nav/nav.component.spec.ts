import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ApolloTestingModule } from "apollo-angular/testing";
import { SharedModule } from "src/app/shared/shared.module";
import { LayoutModule } from "../layout.module";

import { RouterModule } from "@angular/router";
import { NavComponent } from "./nav.component";

fdescribe("NavComponent", () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterModule.forRoot([]),
        LayoutModule,
        ApolloTestingModule,
      ],
      declarations: [NavComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
