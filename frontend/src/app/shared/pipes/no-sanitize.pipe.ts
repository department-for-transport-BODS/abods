import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'trustMe' })
export class NoSanitizePipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}
  transform(html: string | undefined): SafeHtml | null {
    if (!html) {
      return null;
    }
    return this.domSanitizer.bypassSecurityTrustHtml(html);
  }
}
