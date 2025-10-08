import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ApolloTestingModule } from "apollo-angular/testing";
import { SharedModule } from "src/app/shared/shared.module";
import { LayoutModule } from "../../layout.module";

import { RouterModule } from "@angular/router";
import { UserAccountComponent } from "./user-account.component";

describe("UserAccountComponent", () => {
  let component: UserAccountComponent;
  let fixture: ComponentFixture<UserAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        LayoutModule,
        RouterModule.forRoot([]),
        ApolloTestingModule,
      ],
      declarations: [UserAccountComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
