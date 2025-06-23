import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { NgxTippyProps, NgxTippyService } from "ngx-tippy-wrapper";

@Component({
  selector: "app-dropdown",
  templateUrl: "./dropdown.component.html",
  styleUrls: ["./dropdown.component.scss"],
  standalone: false,
})
export class DropdownComponent implements OnInit {
  @Input() triggerLabel!: string;
  @Input() identifier!: string;
  @Input() position: "top-start" | "bottom-start" = "bottom-start";
  @Input() width = 250;

  @ViewChild("dropdownContent", { read: ElementRef, static: true })
  dropdownContent!: ElementRef;

  constructor(private ngxTippyService: NgxTippyService) {}

  tippyProps: NgxTippyProps = {
    trigger: "click",
    allowHTML: true,
    interactive: true,
    theme: "gds-popover",
    role: "menu",
    zIndex: 90,
    arrow: false,
    offset: [0, -2],
    animation: false,
  };

  get triggerWidth(): string {
    return this.width + "px";
  }

  get isOpen(): boolean {
    return (
      this.ngxTippyService.getInstance(this.identifier)?.state.isMounted ??
      false
    );
  }

  ngOnInit(): void {
    this.setTippyContent();
    this.setTippyPosition();
  }

  private setTippyContent(): void {
    const template = this.dropdownContent.nativeElement;
    this.tippyProps.content = template;
  }

  private setTippyPosition(): void {
    this.tippyProps.placement = this.position;
  }
}
