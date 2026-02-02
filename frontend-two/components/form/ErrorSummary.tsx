import { ErrorInfo } from "@/types";

export const ErrorSummary = ({ errors }: { errors: ErrorInfo[] }) => {
  if (!errors.length) return null;

  return (
    <div
      className="govuk-error-summary"
      aria-labelledby="error-summary-title"
      role="alert"
      tabIndex={-1}
    >
      <h2 className="govuk-error-summary__title" id="error-summary-title">
        There is a problem
      </h2>
      <div className="govuk-error-summary__body">
        <ul className="govuk-list govuk-error-summary__list">
          {errors.map((error) => (
            <li key={error.id}>
              <a href={`#${error.id}`}>{error.errorMessage}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
