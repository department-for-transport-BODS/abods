import { Renderer2 } from "@angular/core";
import { By } from "@angular/platform-browser";
import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { Subject } from "rxjs";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";
import { LayoutModule } from "../../layout/layout.module";
import { SharedModule } from "../../shared/shared.module";
import { ViewServiceMonitoringDashboardComponent } from "./view-service-monitoring-dashboard.component";

describe("ViewServiceMonitoringDashboardComponent", () => {
  let spectator: Spectator<ViewServiceMonitoringDashboardComponent>;
  let component: ViewServiceMonitoringDashboardComponent;
  let userSubject: Subject<unknown>;
  let renderer: Renderer2;

  const createComponent = createComponentFactory({
    component: ViewServiceMonitoringDashboardComponent,
    imports: [SharedModule, LayoutModule],
    mocks: [AuthenticatedUserService],
  });

  beforeEach(() => {
    userSubject = new Subject();
    spectator = createComponent({
      detectChanges: false,
      providers: [
        {
          provide: AuthenticatedUserService,
          useValue: {
            authenticatedUser$: userSubject.asObservable(),
          },
        },
      ],
    });
    component = spectator.component;
    renderer = spectator.fixture.componentRef.injector.get(Renderer2);
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it("should show spinner while loading", async () => {
    component.loading = true;
    spectator.fixture.detectChanges();
    const spinner = spectator.fixture.debugElement.query(By.css("app-spinner"));
    await expect(spinner).toBeTruthy();
  });

  it("should set errors if user cannot view service monitoring", async () => {
    spectator.fixture.detectChanges();
    userSubject.next({
      canViewServiceMonitoring: false,
      serviceMonitoringEmbedUrl: null,
    });
    await spectator.fixture.whenStable();
    await expect(component.errors.length).toBe(1);
    await expect(component.errors[0].error).toContain(
      "Unable to load dashboad",
    );
    expect(component.loading).toBeFalse();
  });

  it("should set errors if user has no embed url", async () => {
    spectator.fixture.detectChanges();
    userSubject.next({
      canViewServiceMonitoring: true,
      serviceMonitoringEmbedUrl: null,
    });
    await spectator.fixture.whenStable();
    await expect(component.errors.length).toBe(1);
    await expect(component.errors[0].error).toContain(
      "Unable to load dashboad",
    );
    expect(component.loading).toBeFalse();
  });

  it("should append iframe with correct attributes if user can view and has url", async () => {
    const testUrl = "https://test-url";
    spyOn(renderer, "createElement").and.callThrough();
    spyOn(renderer, "setStyle").and.callThrough();
    spyOn(renderer, "setAttribute").and.callThrough();
    spyOn(renderer, "appendChild").and.callThrough();

    spectator.fixture.detectChanges();
    userSubject.next({
      canViewServiceMonitoring: true,
      serviceMonitoringEmbedUrl: testUrl,
    });
    await spectator.fixture.whenStable();

    await expect(component.errors.length).toBe(0);
    await expect(component.serviceMonitoringUrl).toBe(testUrl);
    expect(renderer.createElement).toHaveBeenCalledWith("iframe");
    expect(renderer.setAttribute).toHaveBeenCalledWith(
      jasmine.anything(),
      "src",
      testUrl,
    );
    expect(renderer.appendChild).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.anything(),
    );
    expect(component.loading).toBeFalse();
  });
});
