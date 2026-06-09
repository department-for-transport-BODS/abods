import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { FormErrors } from "../../shared/gds/error-summary/error-summary.component";
import { UserGQL } from "../../../generated/graphql";

@Component({
  selector: "app-view-service-monitoring-dashboard",
  templateUrl: "./view-service-monitoring-dashboard.component.html",
  styleUrls: ["./view-service-monitoring-dashboard.component.scss"],
  standalone: false,
})
export class ViewServiceMonitoringDashboardComponent implements AfterViewInit {
  @ViewChild("iframeContainer", { static: true }) iframeContainer!: ElementRef;

  constructor(
    private renderer: Renderer2,
    private userQuery: UserGQL,
  ) {}

  serviceMonitoringUrl = "";
  errors: FormErrors[] = [];
  loading = true;
  ngAfterViewInit() {
    const iframe = this.renderer.createElement("iframe");

    // Fetch fresh user data with no cache for valid Datadog token
    this.userQuery.fetch({}, { fetchPolicy: "no-cache" }).subscribe({
      next: (result) => {
        const loginInfo = result.data?.user;
        this.loading = false;
        if (
          !loginInfo?.canViewServiceMonitoring ||
          !loginInfo?.serviceMonitoringEmbedUrl
        ) {
          this.errors = [
            {
              error: "Unable to load dashboard. Please contact admin",
              label: "enable-service-monitoring",
            },
          ];
          return;
        }
        this.serviceMonitoringUrl = loginInfo.serviceMonitoringEmbedUrl;
        this.renderer.setStyle(iframe, "border", "none");
        this.renderer.setAttribute(iframe, "src", this.serviceMonitoringUrl);
        this.renderer.setAttribute(iframe, "width", "100%");
        this.renderer.setAttribute(iframe, "height", "100%");
        this.renderer.appendChild(this.iframeContainer.nativeElement, iframe);
        this.errors = [];
      },
      error: (err) => {
        this.loading = false;
        this.errors = [
          {
            error: "Failed to load dashboard. Please try again",
            label: "dashboard-load-error",
          },
        ];
      },
    });
  }
}
