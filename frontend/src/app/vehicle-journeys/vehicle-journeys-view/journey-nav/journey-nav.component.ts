import { Component, Input } from "@angular/core";
import { NgxTippyProps } from "ngx-tippy-wrapper";
import { Journey } from "../../../../generated/graphql";
import { formatJourneyStartTime } from "../../vehicleJourneyUtils";

@Component({
  selector: "app-journey-nav",
  templateUrl: "journey-nav.component.html",
  styleUrls: ["./journey-nav.component.scss"],
  standalone: false,
})
export class JourneyNavComponent {
  @Input() loading = false;
  @Input() journeys: Journey[] = [];
  @Input() currentIndex = -1;

  get next(): Journey | undefined {
    return this.journeys[this.currentIndex + 1];
  }

  get previous(): Journey | undefined {
    return this.journeys[this.currentIndex - 1];
  }

  formatStartTime = formatJourneyStartTime;

  tippyProps: NgxTippyProps = {
    allowHTML: true,
    theme: "gds-tooltip",
    zIndex: 100,
  };
}
