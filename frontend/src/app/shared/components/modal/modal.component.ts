import { Component, Input, ViewChild } from '@angular/core';
import { NgxSmartModalComponent, NgxSmartModalService } from 'ngx-smart-modal';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent {
  @Input() modalTitle?: string;
  @Input() identifier = 'modal';

  @ViewChild(NgxSmartModalComponent) modal!: NgxSmartModalComponent;

  constructor(public ngxSmartModalService: NgxSmartModalService) {}

  close() {
    this.modal.close();
  }
}
