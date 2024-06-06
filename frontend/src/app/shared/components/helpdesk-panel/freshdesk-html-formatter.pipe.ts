import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'freshdeskHtmlFormatter',
})
export class FreshdeskHtmlFormatterPipe implements PipeTransform {
  transform(value: string): string {
    value = this.replaceWidthValues(value);
    return value;
  }

  private replaceWidthValues(value: string): string {
    const widthRegex = /width: \d*px;/gm;
    return value.replace(widthRegex, 'width: 100%;');
  }
}
