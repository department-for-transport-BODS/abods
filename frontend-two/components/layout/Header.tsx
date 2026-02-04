import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useHelpdesk } from "@/contexts/HelpdeskContext";

export const Header = ({ serviceName }: { serviceName: string }) => {
  const { isAuthenticated } = useAuth();
  const { open: openHelpdesk } = useHelpdesk();

  return (
    <header
      className="govuk-header header"
      role="banner"
      data-module="govuk-header"
    >
      <div className="govuk-header__container header__container govuk-width-container">
        <div className="govuk-header__logo header__logo">
          <Link
            href="/"
            className="govuk-header__link govuk-header__link--homepage"
          >
            <span className="govuk-header__logotype">
              <span className="govuk-header__logotype-text">GOV.UK</span>
            </span>
            <span className="govuk-header__product-name">{serviceName}</span>
          </Link>
        </div>
        {isAuthenticated ? (
          <button
            className="govuk-header__link unbuttoned govuk__link header__help-link"
            type="button"
            onClick={openHelpdesk}
          >
            <span className="govuk-visually-hidden">Help</span>
            <img
              className="header__help-icon"
              src="/assets/icons/question-in-circle.svg"
              alt=""
              aria-hidden="true"
            />
            Help
          </button>
        ) : null}
      </div>
    </header>
  );
};
