import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { Page } from "@/components/layout/Page";
import styles from "@/components/layout/Page/page.module.scss";

describe("Page", () => {
  it("renders the back link before the padded page content", () => {
    render(
      <Page backLink={<Link href="/operators">All operators</Link>}>
        <h1>Live status</h1>
      </Page>,
    );

    const backLink = screen.getByRole("link", { name: "All operators" });
    const pageContent = screen.getByRole("main");

    expect(pageContent.parentElement).toHaveClass(styles.page);
    expect(backLink.parentElement).toHaveClass(styles.backLink);
    expect(pageContent).toHaveClass("govuk-main-wrapper", styles.mainWrapper);
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

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const pageContent = screen.getByRole("main");

    expect(pageContent.parentElement).toHaveClass(styles.page);
    expect(pageContent).toHaveClass("govuk-main-wrapper", styles.mainWrapper);
    expect(pageContent).toHaveAttribute("id", "content");
  });
});
