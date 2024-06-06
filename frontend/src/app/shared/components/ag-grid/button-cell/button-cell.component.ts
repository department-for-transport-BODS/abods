import { Component, ElementRef, ViewChild } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export interface ButtonCellRendererParams extends ICellRendererParams {
  label?: string;
  click: (params: ICellRendererParams) => ($event: MouseEvent) => void;
}

@Component({
  template: `<button #button type="button" class="button-link" (click)="onClick($event)">{{ label }}</button>`,
  styleUrls: ['./button-cell.component.scss'],
})
export class ButtonCellRendererComponent implements AgRendererComponent {
  label?: string;
  @ViewChild('button') buttonElement?: ElementRef<HTMLElement>;

  onClick: (event: MouseEvent) => void = () => {
    // Do nothing
  };

  refresh(params: ButtonCellRendererParams): boolean {
    this.agInit(params);
    return true;
  }

  agInit(params: ButtonCellRendererParams) {
    this.label = params.label ?? params.valueFormatted ?? params.value;
    this.onClick = params.click(params);

    // accessibility - ag-grid seems to swallow keyboard events.
    params.eGridCell.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        this.buttonElement?.nativeElement.click();
      }
    });
  }
}
