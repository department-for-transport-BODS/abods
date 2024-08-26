import { Component, OnInit } from '@angular/core';
import { initAll } from 'govuk-frontend';
import { HelpdeskPanelService } from '../../shared/components/helpdesk-panel/helpdesk-panel.service';
import { NavService } from './nav.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  constructor(public navService: NavService, private helpdeskPanelService: HelpdeskPanelService) {}

  ngOnInit(): void {
    initAll();
  }

  openHelpdesk() {
    this.helpdeskPanelService.open();
  }
}
