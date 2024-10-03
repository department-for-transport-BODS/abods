import { Component, Input } from '@angular/core';
import { NavService } from '../nav.service';
@Component({
  selector: 'app-nav-toggle',
  templateUrl: './nav-toggle.component.html',
  styleUrls: ['./nav-toggle.component.scss'],
})
export class NavToggleComponent {
  @Input() appearance?: 'light';

  constructor(public navService: NavService) {}

  get toggleClasses() {
    return {
      'nav-toggle': true,
      'nav-toggle--active': this.navService.isOpen,
      [`nav-toggle--${this.appearance}`]: this.appearance,
    };
  }
}
