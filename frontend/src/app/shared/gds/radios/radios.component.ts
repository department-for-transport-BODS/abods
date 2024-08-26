import { Component, Input } from '@angular/core';
@Component({
  selector: 'gds-radios',
  templateUrl: './radios.component.html',
})
export class RadiosComponent {
  @Input() layout?: 'inline';
  @Input() legend?: string;
  @Input() identifier!: string;
  @Input() size?: 'small';
  @Input() hint?: string;
  @Input() error?: string;
  @Input() errorId?: string;
  @Input() conditional?: boolean;
  @Input() legendSize?: 'small' | 'medium' | 'large';
}
