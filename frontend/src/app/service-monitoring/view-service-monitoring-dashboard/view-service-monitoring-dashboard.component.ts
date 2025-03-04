import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { ServiceMonitoringEmbedUrlGQL } from "../../../generated/graphql";
import { FormErrors } from "../../shared/gds/error-summary/error-summary.component";

@Component({
  selector: "app-view-service-monitoring-dashboard",
  templateUrl: "./view-service-monitoring-dashboard.component.html",
  styleUrls: ["./view-service-monitoring-dashboard.component.scss"],
})
export class ViewServiceMonitoringDashboardComponent implements AfterViewInit {
  @ViewChild("iframeContainer", { static: true }) iframeContainer!: ElementRef;

  constructor(
    private renderer: Renderer2,
    private serviceMonitorQuery: ServiceMonitoringEmbedUrlGQL,
  ) {}

  serviceMonitoringUrl = "";
  errors: FormErrors[] = [];
  loading = true;
  ngAfterViewInit() {
    const iframe = this.renderer.createElement("iframe");

    this.serviceMonitorQuery.fetch({}).subscribe((response) => {
      this.loading = false;
      if (!response.data.serviceMonitorUrl.enabled) {
        this.errors = [
          {
            error: "Unable to load dashboad. Please contact admin",
            label: "enable-service-monitoring",
          },
        ];
      }
      this.serviceMonitoringUrl = response.data.serviceMonitorUrl.url ?? "";
      this.renderer.setAttribute(iframe, "src", this.serviceMonitoringUrl);
      this.renderer.setAttribute(iframe, "width", "100%");
      this.renderer.setAttribute(iframe, "height", "550");
      this.renderer.appendChild(this.iframeContainer.nativeElement, iframe);
      this.errors = [];
    });
  }
}
