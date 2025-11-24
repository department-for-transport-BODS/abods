import { Component } from "@angular/core";
import { ConfigService } from "src/app/config/config.service";

@Component({
  selector: "app-footer",
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
  standalone: false,
})
export class FooterComponent {
  constructor(public config: ConfigService) {}
}
