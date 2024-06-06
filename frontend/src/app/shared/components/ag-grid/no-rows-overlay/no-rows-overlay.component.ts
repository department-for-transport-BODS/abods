import { AfterContentChecked, Component } from '@angular/core';
import { INoRowsOverlayAngularComp } from 'ag-grid-angular';
import { INoRowsOverlayParams } from 'ag-grid-community';
import { AgGridDomService } from '../ag-grid-dom.service';

export type NoRowsOverlayParams = INoRowsOverlayParams & { message: string };

/**
 * @deprecated not compatible with screen readers. use another way of showing a message.
 */
@Component({
  template: `<div class="no-rows-overlay" [style.height.px]="viewportHeight">{{ message }}</div>`,
  styleUrls: ['./no-rows-overlay.component.scss'],
})
export class NoRowsOverlayComponent implements INoRowsOverlayAngularComp, AfterContentChecked {
  constructor(private agGridDomService: AgGridDomService) {}

  viewportHeight?: number;
  message = 'No data found';

  agInit(params: NoRowsOverlayParams) {
    this.message = params.message;
  }

  ngAfterContentChecked() {
    this.viewportHeight = this.agGridDomService.viewportHeight();
  }
}
