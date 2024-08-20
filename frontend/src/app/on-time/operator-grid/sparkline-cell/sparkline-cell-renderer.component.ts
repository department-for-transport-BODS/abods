import { AgRendererComponent } from 'ag-grid-angular';
import { Component, HostBinding, ViewEncapsulation } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  template: ``,
  encapsulation: ViewEncapsulation.None,
})
export class SparklineCellRendererComponent implements AgRendererComponent {
  @HostBinding('innerHtml')
  content?: SafeHtml;

  agInit(params: ICellRendererParams): void {
    this.content = params.value;
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params);
    return false;
  }
}
