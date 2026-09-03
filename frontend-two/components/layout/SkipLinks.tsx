export const SkipLinks = ({
  contentId,
  navId,
}: {
  contentId: string;
  navId: string;
}) => (
  <>
    <a href={`#${contentId}`} className="govuk-skip-link">
      Skip to main content
    </a>
    <a href={`#${navId}`} className="govuk-skip-link">
      Skip to navigation
    </a>
  </>
);
