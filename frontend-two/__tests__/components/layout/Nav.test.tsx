import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Nav } from "@/components/layout/Nav";
import styles from "@/components/layout/Nav/nav.module.scss";

let mockAsPath = "/corridors";

vi.mock("next/router", () => ({
  useRouter: () => ({
    asPath: mockAsPath,
    pathname: "/corridors",
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      canViewServiceMonitoring: true,
      canViewDistances: true,
    },
  }),
}));

vi.mock("@/contexts/HelpdeskContext", () => ({
  useHelpdesk: () => ({
    open: vi.fn(),
  }),
}));

vi.mock("@/contexts/NavContext", () => ({
  useNav: () => ({
    isOpen: false,
    close: vi.fn(),
  }),
}));

vi.mock("@/components/layout/UserAccount", () => ({
  UserAccount: () => <div data-testid="user-account" />,
}));

describe("Nav", () => {
  it("keeps Corridors selected on nested corridor routes", () => {
    mockAsPath = "/corridors/create";

    render(<Nav />);

    expect(screen.getByRole("link", { name: "Corridors" })).toHaveClass(
      styles.linkCurrent,
    );
  });

  it("keeps Corridors selected on corridor edit routes", () => {
    mockAsPath = "/corridors/edit/12";

    render(<Nav />);

    expect(screen.getByRole("link", { name: "Corridors" })).toHaveClass(
      styles.linkCurrent,
    );
  });
});
