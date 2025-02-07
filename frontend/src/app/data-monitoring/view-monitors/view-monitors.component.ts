import { Component } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Component({
  selector: "app-view-monitors",
  templateUrl: "./view-monitors.component.html",
  styleUrls: ["./view-monitors.component.scss"],
})
export class ViewMonitorsComponent {
  quicksightEmbedUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {
    const embedUrl =
      "https://eu-west-2.quicksight.aws.amazon.com/embed/2d6a53d858a94f688e75d33dcdcbc30a/dashboards/949f55f3-7ae0-4386-9303-f14bdd54ee45?identityprovider=quicksight&isauthcode=true&code=AYABeKwqzd0v05wdfCpDjl2A560AAAABAAdhd3Mta21zAEthcm46YXdzOmttczpldS13ZXN0LTI6NjQ5MTA0MjA5NDE4OmtleS9lZGQ0ZjBlNC03M2U0LTQ4NGEtYjBmYy0yYjEzNDI0YThlODUAuAECAQB40arshFNPPoBUAbB9hRxqalRsdpuiVanS5r6RYzejOEIBYX7cn4vM_yFbhZiSxxuN_gAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDNYoXWAz3wT1bn_yGwIBEIA7zsZLML5kvHaDP2CTGZi3QGN8PVrMROwk9CaQ6-HU79O0NIbu647zd99xAJPZRW7u0ioaTPCN66oHWzMCAAAAAAwAABAAAAAAAAAAAAAAAAAAyXlfx1O4VnJv9zTeTrGDQP____8AAAABAAAAAAAAAAAAAAABAAAAm8i9aRpWdZs2GDULPVPcaksjmQFa442bQX5pYrJfqk7paZ6M3Tvc3OyJRrGTvh1MGi3GsHsq78FwaXMAyg4Ddbc-oDDpNQ_iw74i62CejfkAtcQ8y4BmARC_DSp9IxVlizzo0gHEVkO7cKtRjUXQ6ply8LCESVDqZV4KmwI9gKTd4AyATnpAOnqIr_EQzXk0JiLCGpkzZ1FJdWrpHKHHL3FAjz-ZlUOG24inVw%3D%3D";

    this.quicksightEmbedUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}
