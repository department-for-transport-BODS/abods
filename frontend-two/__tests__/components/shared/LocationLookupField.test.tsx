import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LocationLookupField,
  LocationLookupSelection,
} from "@/components/shared/LocationLookupField";

describe("LocationLookupField", () => {
  const mockFetch = vi.fn();

  const Harness = ({
    onSelect,
  }: {
    onSelect: (selection: LocationLookupSelection) => void;
  }) => {
    const [value, setValue] = React.useState("");

    return (
      <LocationLookupField
        id="location-query"
        label="Location name or postcode"
        value={value}
        onValueChange={setValue}
        onSelect={onSelect}
        mapboxToken="test-token"
      />
    );
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            id: "place.1",
            text: "Test location",
            center: [-1, 53],
            bbox: [-1.1, 52.9, -0.9, 53.1],
          },
        ],
      }),
    } as Response);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("looks up locations and passes the selected result back", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    await user.type(screen.getByRole("textbox"), "Test");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Test location" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Test location" }));

    expect(onSelect).toHaveBeenCalledWith({
      id: "place.1",
      label: "Test location",
      center: [-1, 53],
      bbox: [-1.1, 52.9, -0.9, 53.1],
    });
  });
});
