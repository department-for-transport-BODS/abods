import { Component } from "@angular/core";
import { ILoadingOverlayAngularComp } from "ag-grid-angular";
import { ILoadingOverlayParams } from "ag-grid-community";

@Component({
  standalone: false,
  selector: "app-loading-overlay",
  template: `
    <app-spinner [vCentre]="true" message="Loading..." size="default">
    </app-spinner>
  `,
})
export class CustomLoadingOverlayComponent
  implements ILoadingOverlayAngularComp
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  agInit(_: ILoadingOverlayParams): void {}
}
