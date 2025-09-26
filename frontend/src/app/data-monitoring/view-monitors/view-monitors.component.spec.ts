import {
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { of } from "rxjs";
import { DashboadEmbeddedUrlGQL } from "../../../generated/graphql";
import { LayoutModule } from "../../layout/layout.module";
import { GdsModule } from "../../shared/gds/gds.module";
import { SharedModule } from "../../shared/shared.module";
import { ViewMonitorsComponent } from "./view-monitors.component";

describe("ViewMonitorsComponent", () => {
  let spectator: Spectator<ViewMonitorsComponent>;
  let component: ViewMonitorsComponent;
  let embeddedUrlQuerySpy: SpyObject<DashboadEmbeddedUrlGQL>;

  const createComponent = createComponentFactory({
    component: ViewMonitorsComponent,
    imports: [SharedModule, GdsModule, LayoutModule, ApolloTestingModule],
    detectChanges: false,
    mocks: [DashboadEmbeddedUrlGQL],
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    embeddedUrlQuerySpy = spectator.inject(DashboadEmbeddedUrlGQL);
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it("should set loading to false and clear errors on successful embed", async () => {
    spyOn(component, "embedDashboard").and.resolveTo();
    embeddedUrlQuerySpy.fetch.and.returnValue(
      of({
        data: {
          embeddedUrl: {
            enabled: true,
            url: "https://test-embed-url",
          },
        },
        loading: false,
        networkStatus: 7,
        errors: undefined,
      }),
    );

    component.ngOnInit();
    // Wait for async mergeMap and subscribe to resolve
    await spectator.fixture.whenStable();

    expect(component.loading).toBeFalse();
    await expect(component.errors).toEqual([]);
    expect(component.embedDashboard).toHaveBeenCalledWith(
      "https://test-embed-url",
    );
  });

  it("should set error if embeddedUrl.enabled is false", async () => {
    embeddedUrlQuerySpy.fetch.and.returnValue(
      of({
        data: {
          embeddedUrl: {
            enabled: false,
            url: "https://test-embed-url",
          },
        },
        loading: false,
        networkStatus: 7,
        errors: undefined,
      }),
    );

    component.ngOnInit();
    await spectator.fixture.whenStable();

    expect(component.loading).toBeFalse();
    await expect(component.errors.length).toBe(1);
    await expect(component.errors[0].error).toContain(
      "Unable to load dashboad",
    );
  });

  it("should set error if embeddedUrl.url is missing", async () => {
    embeddedUrlQuerySpy.fetch.and.returnValue(
      of({
        data: {
          embeddedUrl: {
            enabled: true,
            url: null,
          },
        },
        loading: false,
        networkStatus: 7,
        errors: undefined,
      }),
    );

    component.ngOnInit();
    await spectator.fixture.whenStable();

    expect(component.loading).toBeFalse();
    await expect(component.errors.length).toBe(1);
    await expect(component.errors[0].error).toContain(
      "Unable to load dashboad",
    );
  });

  it("should set error if embedDashboard throws", async () => {
    spyOn(component, "embedDashboard").and.rejectWith({
      message: "Test error",
    });
    embeddedUrlQuerySpy.fetch.and.returnValue(
      of({
        data: {
          embeddedUrl: {
            enabled: true,
            url: "https://test-embed-url",
          },
        },
        loading: false,
        networkStatus: 7,
        errors: undefined,
      }),
    );

    component.ngOnInit();
    await spectator.fixture.whenStable();

    expect(component.loading).toBeFalse();
    await expect(component.errors.length).toBe(1);
    await expect(component.errors[0].error).toContain(
      "Unable to load dashboad",
    );
  });
});
