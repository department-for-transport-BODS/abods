import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "app-scheduled-route-toggle",
  templateUrl: "./map-view-scheduled-route-toggle.component.html",
  styleUrls: ["./map-view-scheduled-route-toggle.scss"],
  standalone: false,
})
export class ScheduledRouteToggleComponent {
  @Input() visible = true;
  @Output() visibleChange = new EventEmitter<boolean>();

  scheduledRouteOption = this.visible ? "show" : "hide";

  ngOnChanges() {
    this.scheduledRouteOption = this.visible ? "show" : "hide";
  }

  onScheduledRouteChange(value: string) {
    const visible = value === "show";
    this.visible = visible;
    this.visibleChange.emit(visible);
  }
}
