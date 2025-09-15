import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ViewMonitorsComponent } from "./view-monitors.component";
import { DashboadEmbeddedUrlGQL } from "../../../generated/graphql";
import { of } from "rxjs";
import { ElementRef } from "@angular/core";
import { SharedModule } from "../../shared/shared.module";
import { GdsModule } from "../../shared/gds/gds.module";
import { LayoutModule } from "../../layout/layout.module";

describe("ViewMonitorsComponent", () => {
  let component: ViewMonitorsComponent;
  let fixture: ComponentFixture<ViewMonitorsComponent>;
  let embeddedUrlQuerySpy: jasmine.SpyObj<DashboadEmbeddedUrlGQL>;

  beforeEach(async () => {
    embeddedUrlQuerySpy = jasmine.createSpyObj("DashboadEmbeddedUrlGQL", [
      "fetch",
    ]);

    await TestBed.configureTestingModule({
      declarations: [ViewMonitorsComponent],
      imports: [SharedModule, GdsModule, LayoutModule],
      providers: [
        { provide: DashboadEmbeddedUrlGQL, useValue: embeddedUrlQuerySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewMonitorsComponent);
    component = fixture.componentInstance;
    component.dashboardContainer = new ElementRef(
      document.createElement("div"),
    );
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set loading to false and clear errors on successful embed", async () => {
    spyOn(component, "embedDashboard").and.returnValue(Promise.resolve());
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
    await fixture.whenStable();

    expect(component.loading).toBeFalse();
    expect(component.errors).toEqual([]);
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
    await fixture.whenStable();

    expect(component.loading).toBeFalse();
    expect(component.errors.length).toBe(1);
    expect(component.errors[0].error).toContain("Unable to load dashboad");
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
    await fixture.whenStable();

    expect(component.loading).toBeFalse();
    expect(component.errors.length).toBe(1);
    expect(component.errors[0].error).toContain("Unable to load dashboad");
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
    await fixture.whenStable();

    expect(component.loading).toBeFalse();
    expect(component.errors.length).toBe(1);
    expect(component.errors[0].error).toContain("Unable to load dashboad");
  });
});
