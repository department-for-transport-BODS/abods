import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { FormErrors } from "../../shared/gds/error-summary/error-summary.component";
import { CheckServiceMonitoringGQL } from "../../../generated/graphql";
import { map } from "rxjs";

@Component({
  selector: "app-view-service-monitoring-dashboard",
  templateUrl: "./view-service-monitoring-dashboard.component.html",
  styleUrls: ["./view-service-monitoring-dashboard.component.scss"],
})
export class ViewServiceMonitoringDashboardComponent implements AfterViewInit {
  @ViewChild("iframeContainer", { static: true }) iframeContainer!: ElementRef;

  constructor(
    private renderer: Renderer2,
    private serviceMonitorGql: CheckServiceMonitoringGQL,
  ) {}

  serviceMonitoringUrl = "";
  errors: FormErrors[] = [];
  loading = true;
  ngAfterViewInit() {
    this.serviceMonitorGql
      .mutate({})
      .pipe(
        map((response) => {
          if (!response.data?.accessServiceMonitoring.enabled) {
            return false;
          }
          if (!response.data.accessServiceMonitoring.url) {
            return false;
          }
          try {
            this.loadFrame(response.data.accessServiceMonitoring.url);
            return true;
          } catch {
            return false;
          }
        }),
      )
      .subscribe((success) => {
        this.loading = false;
        if (!success) {
          console.log("Error embedding dashboard");
          this.errors = [
            {
              error: "Unable to load dashboad. Please try again later",
              label: "enable-dashboard",
            },
          ];
          return;
        }
        this.errors = [];
      });
  }

  loadFrame(embedurl: string): void {
    const iframe = this.renderer.createElement("iframe");
    this.serviceMonitoringUrl = embedurl;
    this.renderer.setAttribute(iframe, "src", this.serviceMonitoringUrl);
    this.renderer.setAttribute(iframe, "width", "100%");
    this.renderer.setAttribute(iframe, "height", "550");
    this.renderer.appendChild(this.iframeContainer.nativeElement, iframe);
  }
}
