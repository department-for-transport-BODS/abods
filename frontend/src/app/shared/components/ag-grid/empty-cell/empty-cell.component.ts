import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';

@Component({
  selector: 'app-empty-cell',
  template: '',
})
export class EmptyCellComponent implements AgRendererComponent {
  refresh(): boolean {
    return true;
  }
  agInit(): void {
    return;
  }
}
