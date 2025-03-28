import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { FormErrors } from "../../shared/gds/error-summary/error-summary.component";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";

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
    private userService: AuthenticatedUserService,
  ) {}

  serviceMonitoringUrl = "";
  errors: FormErrors[] = [];
  loading = true;
  ngAfterViewInit() {
    const iframe = this.renderer.createElement("iframe");

    this.userService.authenticatedUser$.subscribe((loginInfo) => {
      this.loading = false;
      if (
        !loginInfo.canViewServiceMonitoring ||
        !loginInfo.serviceMonitoringEmbedUrl
      ) {
        this.errors = [
          {
            error: "Unable to load dashboad. Please contact admin",
            label: "enable-service-monitoring",
          },
        ];
        return;
      }
      this.serviceMonitoringUrl = loginInfo.serviceMonitoringEmbedUrl;
      this.renderer.setAttribute(iframe, "src", this.serviceMonitoringUrl);
      this.renderer.setAttribute(iframe, "width", "100%");
      this.renderer.setAttribute(iframe, "height", "550");
      this.renderer.appendChild(this.iframeContainer.nativeElement, iframe);
      this.errors = [];
    });
  }
}
