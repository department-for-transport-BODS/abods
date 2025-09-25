import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterModule } from "@angular/router";
import { ApolloTestingModule } from "apollo-angular/testing";
import { LayoutModule } from "src/app/layout/layout.module";
import { AuthenticationService } from "../authentication.service";
import { LogoutComponent } from "./logout.component";

fdescribe("LogoutComponent", () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;
  let authenticationService: AuthenticationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogoutComponent],
      imports: [RouterModule.forRoot([]), LayoutModule, ApolloTestingModule],
      providers: [
        {
          provide: AuthenticationService,
          useValue: {
            logout: jasmine.createSpy("logout"),
          },
        },
      ],
    }).compileComponents();
    authenticationService = TestBed.inject(AuthenticationService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it("should call logout", () => {
    component.logout();

    expect(authenticationService.logout).toHaveBeenCalledWith();
  });
});
