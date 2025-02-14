import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { createEmbeddingContext } from "amazon-quicksight-embedding-sdk";
import { DataMonitoringService } from "../data-monitoring.service";
import { FormErrors } from "../../shared/gds/error-summary/error-summary.component";

@Component({
  selector: "app-view-monitors",
  templateUrl: "./view-monitors.component.html",
  styleUrls: ["./view-monitors.component.scss"],
})
export class ViewMonitorsComponent implements AfterViewInit {
  @ViewChild("dashboardContainer", { static: false })
  dashboardContainer!: ElementRef;

  errors: FormErrors[] = [];

  embedUrl = "";
  loading = false;
  showButton = false;

  constructor(private service: DataMonitoringService) {}
  ngAfterViewInit(): void {
    this.service.dashboardUser.subscribe((user) => {
      if (user.enabled && user.url) {
        this.errors = [];
        this.embedDashboard(user.url);
      } else {
        this.showButton = true;
      }
    });
  }

  onButtonClick(): void {
    this.loading = true;
    this.service.embeddedUrl.subscribe((user) => {
      if (user.enabled) {
        this.embedDashboard(user.url);
      } else {
        this.loading = false;
        if (this.errors.length === 0) {
          this.errors.push({
            error: "Unable to load dashboad. Please contact admin",
            label: "enable-dashboard-button",
          });
        }
      }
    });
  }

  embedDashboard(embedUrl: string | undefined | null): void {
    const containerDiv = document.getElementById("dashboardContainer") ?? "";
    if (embedUrl) {
      const options = {
        url: embedUrl,
        container: containerDiv,
        scrolling: "no",
        height: "700px",
        width: "100%",
        locale: "en-US",
        footerPaddingEnabled: true,
        printEnabled: true,
      };

      createEmbeddingContext()
        .then((context) => {
          context
            .embedDashboard(options)
            .then(() => (this.showButton = true))
            .catch(() => {
              console.log("Error embedding dashboard.");
            });
        })
        .catch(() => {
          console.log("Error creating embedding context");
        });
    }

    //this.dashboard = embeddingContext.embedDashboard(options);
  }
}
