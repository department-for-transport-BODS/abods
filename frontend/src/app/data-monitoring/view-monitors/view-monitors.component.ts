import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { createEmbeddingContext } from "amazon-quicksight-embedding-sdk";
import { FormErrors } from "../../shared/gds/error-summary/error-summary.component";
import { DashboadEmbeddedUrlGQL } from "../../../generated/graphql";
import { mergeMap } from "rxjs";

@Component({
  selector: "app-view-monitors",
  templateUrl: "./view-monitors.component.html",
  styleUrls: ["./view-monitors.component.scss"],
})
export class ViewMonitorsComponent implements OnInit {
  @ViewChild("dashboardContainer", { static: false })
  dashboardContainer!: ElementRef;
  errors: FormErrors[] = [];
  loading = false;

  constructor(private embeddedUrlQuery: DashboadEmbeddedUrlGQL) {}
  ngOnInit(): void {
    this.loading = true;
    this.embeddedUrlQuery
      .fetch({}, { fetchPolicy: "no-cache" })
      .pipe(
        mergeMap(async (response) => {
          if (!response.data?.embeddedUrl.enabled) {
            return false;
          }
          if (!response.data.embeddedUrl.url) {
            return false;
          }
          try {
            await this.embedDashboard(response.data.embeddedUrl.url);
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
              error: "Unable to load dashboad. Please contact admin",
              label: "enable-dashboard",
            },
          ];
          return;
        }
        this.errors = [];
      });
  }

  async embedDashboard(embedUrl: string): Promise<void> {
    const context = await createEmbeddingContext();
    await context.embedDashboard({
      url: embedUrl,
      container: this.dashboardContainer.nativeElement,
      height: "700px",
      width: "100%",
    });
  }
}
