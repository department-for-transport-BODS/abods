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
  return preserveHyperlinks(value.replace(widthRegex, "width: 100%;"));
}

/**
 * Ensures anchor tags in Freshdesk article HTML render as visible, accessible links.
 */
function preserveHyperlinks(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("a[href]").forEach((anchor) => {
    const existingClass = anchor.getAttribute("class") ?? "";
    if (!existingClass.split(/\s+/).includes("govuk-link")) {
      anchor.setAttribute(
        "class",
        existingClass ? `${existingClass} govuk-link` : "govuk-link",
      );
    }

    if (!anchor.hasAttribute("target")) {
      anchor.setAttribute("target", "_blank");
    }

    const rel = new Set(
      (anchor.getAttribute("rel") ?? "").split(/\s+/).filter(Boolean),
    );
    rel.add("noopener");
    rel.add("noreferrer");
    anchor.setAttribute("rel", Array.from(rel).join(" "));
  });

  return doc.body.innerHTML;
}
