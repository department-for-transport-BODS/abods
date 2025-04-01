import {
  AfterViewInit,
  Component,
  ContentChild,
  Input,
  TemplateRef,
} from "@angular/core";
import { StatTemplateDirective } from "./stat.directive";

@Component({
  selector: "app-stat",
  templateUrl: "./stat.component.html",
  styleUrls: ["./stat.component.scss"],
  standalone: false,
})
export class StatComponent<T> implements AfterViewInit {
  @Input() label?: string;
  @Input() statValue?: T;
  @Input() tooltip?: string | TemplateRef<any>;
  @Input() identifier?: string;
  @Input() statLoaded = true;
  @ContentChild(StatTemplateDirective, { read: TemplateRef })
  statTemplate?: TemplateRef<T>;
  @Input() statFormatter?: (t: T) => string;

  format(): string {
    return this.statFormatter?.call(this, this.statValue ?? ({} as T)) ?? "";
  }

  ngAfterViewInit(): void {
    if (this.statFormatter && this.statTemplate) {
      throw new Error("Either specify a formatter or a template, not both.");
    }
  }
}
