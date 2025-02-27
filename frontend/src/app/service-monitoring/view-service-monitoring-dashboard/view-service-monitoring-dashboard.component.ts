import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
} from "@angular/core";

@Component({
  selector: "app-view-service-monitoring-dashboard",
  templateUrl: "./view-service-monitoring-dashboard.component.html",
  styleUrls: ["./view-service-monitoring-dashboard.component.scss"],
})
export class ViewServiceMonitoringDashboardComponent implements AfterViewInit {
  @ViewChild("iframeContainer", { static: true }) iframeContainer!: ElementRef;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit() {
    const iframe = this.renderer.createElement("iframe");
    this.renderer.setAttribute(
      iframe,
      "src",
      "https://p.datadoghq.eu/sb/embed/e2f4b96a-30e0-11ec-a6fa-da7ad0900005-e3c4b6e999216c5bdb39edf1633a2848",
    ); // Set iframe source
    this.renderer.setAttribute(iframe, "width", "100%");
    this.renderer.setAttribute(iframe, "height", "550");
    this.renderer.appendChild(this.iframeContainer.nativeElement, iframe);
  }
}
