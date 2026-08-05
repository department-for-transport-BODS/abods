/**
 * Formats raw Freshdesk article HTML for display.
 * Freshdesk articles are authored with fixed pixel widths (e.g. images/tables), which we want to
 * stretch to fill the available width in the helpdesk panel instead.
 */
export function formatFreshdeskHtml(value: string): string {
  if (!value) {
    return value;
  }
  const widthRegex = /width: \d*px;/gm;
  return value.replace(widthRegex, "width: 100%;");
}
