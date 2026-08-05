import { formatFreshdeskHtml } from "@/utils/helpdesk";

describe("formatFreshdeskHtml", () => {
  it("returns the input unchanged when value is empty", () => {
    expect(formatFreshdeskHtml("")).toBe("");
  });

  it("returns falsy values as-is", () => {
    // @ts-expect-error testing runtime guard against non-string falsy values
    expect(formatFreshdeskHtml(null)).toBe(null);
    // @ts-expect-error testing runtime guard against non-string falsy values
    expect(formatFreshdeskHtml(undefined)).toBe(undefined);
  });

  it("replaces a single fixed pixel width with 100%", () => {
    const input = '<img style="width: 300px;" src="test.png" />';
    const expected = '<img style="width: 100%;" src="test.png" />';
    expect(formatFreshdeskHtml(input)).toBe(expected);
  });

  it("replaces multiple fixed pixel widths with 100%", () => {
    const input =
      '<table style="width: 500px;"><tr><td style="width: 120px;">Cell</td></tr></table>';
    const expected =
      '<table style="width: 100%;"><tr><td style="width: 100%;">Cell</td></tr></table>';
    expect(formatFreshdeskHtml(input)).toBe(expected);
  });

  it("handles widths with no digits (e.g. 'width: px;')", () => {
    const input = '<div style="width: px;">content</div>';
    const expected = '<div style="width: 100%;">content</div>';
    expect(formatFreshdeskHtml(input)).toBe(expected);
  });

  it("leaves content without pixel widths unchanged", () => {
    const input = '<div style="height: 100px; color: red;">content</div>';
    expect(formatFreshdeskHtml(input)).toBe(input);
  });
});
