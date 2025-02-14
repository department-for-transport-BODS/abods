import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { createEmbeddingContext } from "amazon-quicksight-embedding-sdk";
import { DataMonitoringService } from "../data-monitoring.service";

@Component({
  selector: "app-view-monitors",
  templateUrl: "./view-monitors.component.html",
  styleUrls: ["./view-monitors.component.scss"],
})
export class ViewMonitorsComponent implements AfterViewInit {
  @ViewChild("dashboardContainer", { static: false })
  dashboardContainer!: ElementRef;

  embedUrl = "";
  loading = true;
  showButton = false;

  constructor(private service: DataMonitoringService) {}
  ngAfterViewInit(): void {
    this.service.dashboardUser.subscribe((user) => {
      if (user.enabled && user.url) {
        this.embedDashboard(user.url);
      } else {
        this.showButton = true;
      }
    });
  }

  onButtonClick(): void {
    this.service.embeddedUrl.subscribe((user) => this.embedDashboard(user.url));
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
            .then(() => (this.loading = false))
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
