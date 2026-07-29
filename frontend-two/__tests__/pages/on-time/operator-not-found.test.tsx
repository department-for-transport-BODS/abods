import { render, screen } from "@testing-library/react";
import OnTimeOperatorNotFoundPage from "@/pages/on-time/operator-not-found";

vi.mock("@/hooks/useAuth", () => ({
  useRequireAuth: vi.fn(),
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock("@/components/layout/BaseLayout", () => ({
  BaseLayout: ({
    backLink,
    children,
  }: {
    backLink?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="base-layout">
      {backLink}
      {children}
    </div>
  ),
}));

describe("OnTimeOperatorNotFoundPage", () => {
  it("renders heading and navigation links", () => {
    render(<OnTimeOperatorNotFoundPage />);

    expect(
      screen.getByRole("heading", { name: "Not found" }),
    ).toBeInTheDocument();
    const onTimeLinks = screen.getAllByRole("link", {
      name: "On-time performance",
    });
    expect(onTimeLinks).toHaveLength(2);
    onTimeLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/on-time");
    });
    expect(
      screen.getByText(
        /Operator not found, or you do not have permission to view/,
      ),
    ).toBeInTheDocument();
  });
});
