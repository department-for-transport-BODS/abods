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

  constructor(private service: DataMonitoringService) {}
  ngAfterViewInit(): void {
    this.service.embeddedUrl.subscribe((url) => this.embedDashboard(url));
  }

  embedDashboard(embedUrl: string): void {
    const containerDiv = document.getElementById("dashboardContainer") ?? "";
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
            console.log("test2----");
          });
      })
      .catch(() => {
        console.log("test----");
      });
    //this.dashboard = embeddingContext.embedDashboard(options);
  }
}
