import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HelpdeskPanel from "@/components/shared/HelpdeskPanel";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { useConfig } from "@/contexts/ConfigContext";
import { FreshdeskArticle, HelpdeskContextType } from "@/types/helpdesk";

vi.mock("@/contexts/HelpdeskContext", () => ({
  useHelpdesk: vi.fn(),
}));

vi.mock("@/contexts/ConfigContext", () => ({
  useConfig: vi.fn(),
}));

const mockAccordionInit = vi.fn();

vi.mock("govuk-frontend", () => ({
  Accordion: class {
    constructor(container: HTMLElement) {
      mockAccordionInit(container);
    }
  },
}));

const mockUseHelpdesk = vi.mocked(useHelpdesk);
const mockUseConfig = vi.mocked(useConfig);

const buildArticle = (
  overrides: Partial<FreshdeskArticle> = {},
): FreshdeskArticle => ({
  id: "1",
  type: 1,
  status: 2,
  agent_id: 1,
  created_at: "2024-01-01",
  category_id: 1,
  folder_id: 1,
  title: "How do I use this feature?",
  updated_at: "2024-01-01",
  description: '<p style="width: 300px;">Some help content</p>',
  description_text: "Some help content",
  seo_data: { meta_title: "", meta_description: "" },
  tags: [],
  attachments: [],
  cloud_files: [],
  thumbs_up: 0,
  thumbs_down: 0,
  hits: 0,
  suggested: 0,
  feedback_count: 0,
  ...overrides,
});

const buildHelpdeskContext = (
  overrides: Partial<HelpdeskContextType> = {},
): HelpdeskContextType => ({
  isOpen: true,
  data: { title: "Help", articles: [] },
  open: vi.fn(),
  close: vi.fn(),
  loadData: vi.fn(),
  ...overrides,
});

describe("HelpdeskPanel", () => {
  beforeEach(() => {
    mockAccordionInit.mockClear();
    mockUseConfig.mockReturnValue({
      config: { supportEmail: "support@example.com" } as never,
      isLoading: false,
      error: null,
    });
  });

  it("renders nothing when the helpdesk panel is closed", () => {
    mockUseHelpdesk.mockReturnValue(
      buildHelpdeskContext({ isOpen: false, data: null }),
    );

    const { container } = render(<HelpdeskPanel />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the panel title and closes when the close button is clicked", async () => {
    const close = vi.fn();
    mockUseHelpdesk.mockReturnValue(
      buildHelpdeskContext({
        data: { title: "Corridors help", articles: [] },
        close,
      }),
    );

    const user = userEvent.setup();
    render(<HelpdeskPanel />);

    expect(
      screen.getByRole("heading", { name: "Corridors help" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Close Corridors help panel" }),
    );

    expect(close).toHaveBeenCalledTimes(1);
  });

  it("shows a fallback message with a mailto link when there are no articles", () => {
    mockUseHelpdesk.mockReturnValue(
      buildHelpdeskContext({ data: { title: "Help", articles: [] } }),
    );

    render(<HelpdeskPanel />);

    expect(
      screen.getByText("Sorry, there are no help articles for this section"),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "support@example.com" });
    expect(link).toHaveAttribute("href", "mailto:support@example.com");
  });

  it("falls back to a support prompt when no support email is configured", () => {
    mockUseConfig.mockReturnValue({
      config: {} as never,
      isLoading: false,
      error: null,
    });
    mockUseHelpdesk.mockReturnValue(
      buildHelpdeskContext({ data: { title: "Help", articles: [] } }),
    );

    render(<HelpdeskPanel />);

    expect(
      screen.getByRole("link", { name: "Please Contact Support" }),
    ).toHaveAttribute("href", "mailto:Please Contact Support");
  });

  it("renders an accordion section per article with formatted description html", async () => {
    const article = buildArticle({
      title: "Uploading a timetable",
      seo_data: { meta_title: "", meta_description: "A quick summary" },
    });
    mockUseHelpdesk.mockReturnValue(
      buildHelpdeskContext({ data: { title: "Help", articles: [article] } }),
    );

    render(<HelpdeskPanel />);

    expect(
      screen.getByRole("button", { name: "Uploading a timetable" }),
    ).toBeInTheDocument();
    expect(screen.getByText("A quick summary")).toBeInTheDocument();

    const content = document.querySelector(
      ".govuk-accordion__section-content .govuk-body",
    );
    expect(content?.innerHTML).toContain("width: 100%;");
    expect(content?.innerHTML).not.toContain("width: 300px;");

    await waitFor(() => expect(mockAccordionInit).toHaveBeenCalledTimes(1));
  });

  it("does not render a meta description summary when one is not provided", () => {
    const article = buildArticle({
      seo_data: { meta_title: "", meta_description: "" },
    });
    mockUseHelpdesk.mockReturnValue(
      buildHelpdeskContext({ data: { title: "Help", articles: [article] } }),
    );

    render(<HelpdeskPanel />);

    expect(
      document.querySelector(".govuk-accordion__section-summary"),
    ).not.toBeInTheDocument();
  });
});
