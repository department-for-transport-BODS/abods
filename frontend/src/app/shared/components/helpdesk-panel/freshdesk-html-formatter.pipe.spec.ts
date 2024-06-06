import { FreshdeskHtmlFormatterPipe } from './freshdesk-html-formatter.pipe';

describe('FreshdeskHtmlFormatterPipe', () => {
  it('create an instance', () => {
    const pipe = new FreshdeskHtmlFormatterPipe();

    expect(pipe).toBeTruthy();
  });

  it('should replace width in px with 100%', () => {
    const pipe = new FreshdeskHtmlFormatterPipe();
    const html = '<div style="width: 500px; height: 500px;"></div><p style="width: 250px;"></p>';
    const expected = '<div style="width: 100%; height: 500px;"></div><p style="width: 100%;"></p>';

    expect(pipe.transform(html)).toEqual(expected);
  });
});
