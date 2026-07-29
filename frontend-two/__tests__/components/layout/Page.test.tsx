import { render, screen } from "@testing-library/react";
import { Page } from "@/components/layout/Page";

describe("Page", () => {
  it("renders the back link before the padded page content", () => {
    render(
      <Page backLink={<a href="/operators">All operators</a>}>
        <h1>Live status</h1>
      </Page>,
    );

    const backLink = screen.getByRole("link", { name: "All operators" });
    const pageContent = screen.getByRole("main");

    expect(pageContent.parentElement).toHaveClass("page");
    expect(backLink.parentElement).toHaveClass("page__back-link");
    expect(pageContent).toHaveClass("govuk-main-wrapper", "page__main-wrapper");
    expect(pageContent).toHaveAttribute("id", "content");
    expect(backLink.parentElement?.compareDocumentPosition(pageContent)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(backLink.closest("main")).toBeNull();
  });

  it("renders padded page content without a back-link wrapper", () => {
    render(
      <Page>
        <p>Loading...</p>
      </Page>,
    );

    expect(document.querySelector(".page__back-link")).not.toBeInTheDocument();
    const pageContent = screen.getByRole("main");

    expect(pageContent.parentElement).toHaveClass("page");
    expect(pageContent).toHaveClass("govuk-main-wrapper", "page__main-wrapper");
    expect(pageContent).toHaveAttribute("id", "content");
  });
});
