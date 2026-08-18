import { Renderer2 } from "@angular/core";
import { By } from "@angular/platform-browser";
import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { Subject } from "rxjs";
import { UserGQL } from "../../../generated/graphql";
import { LayoutModule } from "../../layout/layout.module";
import { SharedModule } from "../../shared/shared.module";
import { ViewServiceMonitoringDashboardComponent } from "./view-service-monitoring-dashboard.component";

describe("ViewServiceMonitoringDashboardComponent", () => {
  let spectator: Spectator<ViewServiceMonitoringDashboardComponent>;
  let component: ViewServiceMonitoringDashboardComponent;
  let userQueryMock: { fetch: jasmine.Spy };
  let renderer: Renderer2;

  const createComponent = createComponentFactory({
    component: ViewServiceMonitoringDashboardComponent,
    imports: [SharedModule, LayoutModule],
  });

  beforeEach(() => {
    userQueryMock = {
      fetch: jasmine.createSpy("fetch"),
    };
    spectator = createComponent({
      detectChanges: false,
      providers: [
        {
          provide: UserGQL,
          useValue: userQueryMock,
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
    const fetchSubject = new Subject();
    userQueryMock.fetch.and.returnValue(fetchSubject.asObservable());
    spectator.fixture.detectChanges();
    const spinner = spectator.fixture.debugElement.query(By.css("app-spinner"));
    await expect(spinner).toBeTruthy();
  });

  it("should set errors if user cannot view service monitoring", async () => {
    const fetchSubject = new Subject();
    userQueryMock.fetch.and.returnValue(fetchSubject.asObservable());

    spectator.fixture.detectChanges();
    fetchSubject.next({
      data: {
        user: {
          canViewServiceMonitoring: false,
          serviceMonitoringEmbedUrl: null,
        },
      },
    });
    fetchSubject.complete();
    await spectator.fixture.whenStable();
    await expect(component.errors.length).toBe(1);
    await expect(component.errors[0].error).toContain(
      "Unable to load dashboard",
    );
    expect(component.loading).toBeFalse();
  });

  it("should set errors if user has no embed url", async () => {
    const fetchSubject = new Subject();
    userQueryMock.fetch.and.returnValue(fetchSubject.asObservable());

    spectator.fixture.detectChanges();
    fetchSubject.next({
      data: {
        user: {
          canViewServiceMonitoring: true,
          serviceMonitoringEmbedUrl: null,
        },
      },
    });
    fetchSubject.complete();
    await spectator.fixture.whenStable();
    await expect(component.errors.length).toBe(1);
    await expect(component.errors[0].error).toContain(
      "Unable to load dashboard",
    );
    expect(component.loading).toBeFalse();
  });

  it("should append iframe with correct attributes if user can view and has url", async () => {
    const testUrl = "https://test-url";
    const fetchSubject = new Subject();
    userQueryMock.fetch.and.returnValue(fetchSubject.asObservable());

    spyOn(renderer, "createElement").and.callThrough();
    spyOn(renderer, "setStyle").and.callThrough();
    spyOn(renderer, "setAttribute").and.callThrough();
    spyOn(renderer, "appendChild").and.callThrough();

    spectator.fixture.detectChanges();
    fetchSubject.next({
      data: {
        user: {
          canViewServiceMonitoring: true,
          serviceMonitoringEmbedUrl: testUrl,
        },
      },
    });
    fetchSubject.complete();
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

  it("should set fetch error state when request fails", async () => {
    const fetchSubject = new Subject();
    userQueryMock.fetch.and.returnValue(fetchSubject.asObservable());

    spectator.fixture.detectChanges();
    fetchSubject.error(new Error("network error"));
    await spectator.fixture.whenStable();

    expect(component.errors.length).toBe(1);
    expect(component.errors[0].error).toContain(
      "Failed to load dashboard. Please try again",
    );
    expect(component.loading).toBeFalse();
  });
});
