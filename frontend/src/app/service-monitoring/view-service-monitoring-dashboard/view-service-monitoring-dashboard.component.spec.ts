import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ViewServiceMonitoringDashboardComponent } from "./view-service-monitoring-dashboard.component";
import { Renderer2 } from "@angular/core";
import { Subject } from "rxjs";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";
import { By } from "@angular/platform-browser";
import { LayoutModule } from "../../layout/layout.module";
import { SharedModule } from "../../shared/shared.module";

describe("ViewServiceMonitoringDashboardComponent", () => {
  let component: ViewServiceMonitoringDashboardComponent;
  let fixture: ComponentFixture<ViewServiceMonitoringDashboardComponent>;
  let mockUserService: any;
  let userSubject: Subject<any>;
  let renderer: Renderer2;

  beforeEach(async () => {
    userSubject = new Subject();
    mockUserService = {
      authenticatedUser$: userSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      declarations: [ViewServiceMonitoringDashboardComponent],
      imports: [SharedModule, LayoutModule],
      providers: [
        { provide: AuthenticatedUserService, useValue: mockUserService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewServiceMonitoringDashboardComponent);
    component = fixture.componentInstance;
    renderer = fixture.componentRef.injector.get(Renderer2);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show spinner while loading", () => {
    component.loading = true;
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css("app-spinner"));
    expect(spinner).toBeTruthy();
  });

  it("should set errors if user cannot view service monitoring", () => {
    userSubject.next({
      canViewServiceMonitoring: false,
      serviceMonitoringEmbedUrl: null,
    });
    fixture.detectChanges();
    expect(component.errors.length).toBe(1);
    expect(component.errors[0].error).toContain("Unable to load dashboad");
    expect(component.loading).toBeFalse();
  });

  it("should set errors if user has no embed url", () => {
    userSubject.next({
      canViewServiceMonitoring: true,
      serviceMonitoringEmbedUrl: null,
    });
    fixture.detectChanges();
    expect(component.errors.length).toBe(1);
    expect(component.errors[0].error).toContain("Unable to load dashboad");
    expect(component.loading).toBeFalse();
  });

  it("should append iframe with correct attributes if user can view and has url", () => {
    const testUrl = "https://test-url";
    spyOn(renderer, "createElement").and.callThrough();
    spyOn(renderer, "setStyle").and.callThrough();
    spyOn(renderer, "setAttribute").and.callThrough();
    spyOn(renderer, "appendChild").and.callThrough();

    userSubject.next({
      canViewServiceMonitoring: true,
      serviceMonitoringEmbedUrl: testUrl,
    });
    fixture.detectChanges();

    expect(component.errors.length).toBe(0);
    expect(component.serviceMonitoringUrl).toBe(testUrl);
    expect(renderer.createElement).toHaveBeenCalledWith("iframe");
    expect(renderer.setAttribute).toHaveBeenCalledWith(
      jasmine.anything(),
      "src",
      testUrl,
    );
    expect(renderer.appendChild).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });
});
