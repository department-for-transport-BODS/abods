interface JsonSectionProps {
  title: string;
  description?: string;
  data: unknown;
  error?: string | null;
}

/**
 * Skeleton helper used by the on-time migration pages. Renders a labelled
 * <pre> block containing the JSON returned by an on-time service so the data
 * can be visually compared to the existing Angular implementation.
 */
export const JsonSection = ({
  title,
  description,
  data,
  error,
}: JsonSectionProps) => (
  <section className="govuk-!-margin-bottom-6">
    <h2 className="govuk-heading-m">{title}</h2>
    {description ? <p className="govuk-body">{description}</p> : null}
    {error ? (
      <p className="govuk-error-message">
        <span className="govuk-visually-hidden">Error:</span> {error}
      </p>
    ) : (
      <pre
        className="govuk-body"
        style={{
          background: "#f3f2f1",
          padding: "1rem",
          overflow: "auto",
          maxHeight: "20rem",
          fontSize: "0.75rem",
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    )}
  </section>
);
