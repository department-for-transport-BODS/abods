import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { HelpdeskData, HelpdeskDataService } from '../../services/helpdesk-data.service';
import { HelpdeskPanelService } from './helpdesk-panel.service';

@Component({
  selector: 'app-helpdesk-panel',
  templateUrl: './helpdesk-panel.component.html',
  styleUrls: ['./helpdesk-panel.component.scss'],
})
export class HelpdeskPanelComponent implements OnInit, OnDestroy {
  get isOpen(): boolean {
    return this.helpdeskPanelService.isOpen;
  }

  data: HelpdeskData | null = null;

  constructor(private helpdeskPanelService: HelpdeskPanelService, private helpdeskDataService: HelpdeskDataService) {}

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.helpdeskDataService
      .getHelpdeskData()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.data = data));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  closeHelpdesk() {
    if (this.helpdeskPanelService.isOpen) {
      this.helpdeskPanelService.close();
    }
  }
}
