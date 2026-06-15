import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerTimingPointIcons } from "@/components/stop-analysis/timingPointIcons";

const timingSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M1 1h22v22H1z"/></svg>';

class MockImage {
  width = 24;

  height = 24;

  onload: null | (() => void) = null;

  onerror: null | (() => void) = null;

  set src(_value: string) {
    queueMicrotask(() => {
      this.onload?.();
    });
  }
}

describe("registerTimingPointIcons", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", MockImage as unknown as typeof Image);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("loads the shared SVG and registers tinted map images", async () => {
    const map = {
      addImage: vi.fn(),
      hasImage: vi.fn(() => false),
    };

    await registerTimingPointIcons(map as never);

    expect(map.addImage).toHaveBeenCalledTimes(4);
    expect(map.addImage).toHaveBeenCalledWith(
      "timing-no-data-map",
      expect.objectContaining({ width: 24, height: 24 }),
    );
    expect(map.addImage).toHaveBeenCalledWith(
      "otp-timing-map-red",
      expect.objectContaining({ width: 24, height: 24 }),
    );
    expect(map.addImage).toHaveBeenCalledWith(
      "otp-timing-map-yellow",
      expect.objectContaining({ width: 24, height: 24 }),
    );
    expect(map.addImage).toHaveBeenCalledWith(
      "otp-timing-map-turquoise",
      expect.objectContaining({ width: 24, height: 24 }),
    );
  });
});
