import { Component, Input } from '@angular/core';

// Styling is in the global context so that it can be used outside of the <app-root>
@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
})
export class SpinnerComponent {
  @Input() message!: string;
  @Input() vCentre? = false;
  @Input() size?: 'x-small' | 'small' | 'default' = 'default';

  get spinnerClasses() {
    return {
      spinner: true,
      [`spinner--${this.size}`]: true,
      [`spinner--vcentre`]: this.vCentre,
    };
  }
}
