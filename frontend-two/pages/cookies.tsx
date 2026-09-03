import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";

interface CookiePolicy {
  analyticsEnabled: boolean;
  version: number;
  userSubmitted: boolean;
}

const COOKIE_KEY = "abod_cookies_policy";

const loadPolicy = (fallback: CookiePolicy): CookiePolicy => {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(COOKIE_KEY);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as CookiePolicy;
  } catch {
    return fallback;
  }
};

const savePolicy = (policy: CookiePolicy) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(COOKIE_KEY, JSON.stringify(policy));
};

const CookiesPage = () => {
  const { isAuthenticated } = useAuth();
  const { config } = useConfig();
  const defaultPolicy = useMemo<CookiePolicy>(
    () =>
      config?.defaultCookiePolicy ?? {
        analyticsEnabled: false,
        version: 1,
        userSubmitted: false,
      },
    [config?.defaultCookiePolicy],
  );
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadPolicy(defaultPolicy);
    setChoice(stored.analyticsEnabled ? "yes" : "no");
  }, [defaultPolicy]);

  const onSave = () => {
    if (!choice) return;
    const policy = {
      ...defaultPolicy,
      analyticsEnabled: choice === "yes",
      userSubmitted: true,
    };
    savePolicy(policy);
    setSaved(true);
    window.scrollTo(0, 0);
  };

  return (
    <BaseLayout title="Cookies - Analyse Bus Open Data">
      <h1 className="govuk-heading-xl">Cookies</h1>
      <div className="govuk-grid-row govuk-body">
        <div className="govuk-grid-column-two-thirds">
          {saved ? (
            <div
              className="govuk-notification-banner"
              role="alert"
              aria-labelledby="cookie-saved-title"
            >
              <div className="govuk-notification-banner__header">
                <h2
                  className="govuk-notification-banner__title"
                  id="cookie-saved-title"
                >
                  Success
                </h2>
              </div>
              <div className="govuk-notification-banner__content">
                <p className="govuk-notification-banner__heading">
                  Your cookie settings have been saved.
                </p>
              </div>
            </div>
          ) : null}
          <p className="govuk-body">
            Cookies are small files saved on your phone, tablet or computer when
            you visit a website.
          </p>
          <p className="govuk-body">
            We use cookies to make this site work and collect information about
            how you use our service.
          </p>
          <h2 className="govuk-heading-m">
            Essential cookies (strictly necessary)
          </h2>
          <p className="govuk-body">
            We use an essential cookie to remember when you accept or reject
            cookies on our website.
          </p>
          <table className="govuk-table">
            <caption className="govuk-table__caption">
              Essential cookies we use
            </caption>
            <thead className="govuk-table__head">
              <tr className="govuk-table__row">
                <th scope="col" className="govuk-table__header">
                  Name
                </th>
                <th scope="col" className="govuk-table__header">
                  Purpose
                </th>
                <th scope="col" className="govuk-table__header">
                  Expires
                </th>
              </tr>
            </thead>
            <tbody className="govuk-table__body">
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  abod_cookies_policy
                </th>
                <td className="govuk-table__cell">
                  Saves your cookie consent settings
                </td>
                <td className="govuk-table__cell">1 year</td>
              </tr>
            </tbody>
          </table>
          <h2 className="govuk-heading-m">Analytics cookies (optional)</h2>
          <p className="govuk-body">
            With your permission, we use Google Analytics to collect data about
            how you use this service. This information helps us to improve our
            service.
          </p>
          <p className="govuk-body">
            Google Analytics stores anonymised information about:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>the pages you visit</li>
            <li>how long you spend on each page</li>
            <li>how you arrived at the site</li>
            <li>what you click on while you visit the site</li>
            <li>the device and browser you use</li>
          </ul>
          <p className="govuk-body">
            Google is not allowed to use or share our analytics data with
            anyone.
          </p>
          <table className="govuk-table">
            <caption className="govuk-table__caption">
              Analytics cookies we use
            </caption>
            <thead className="govuk-table__head">
              <tr className="govuk-table__row">
                <th scope="col" className="govuk-table__header">
                  Name
                </th>
                <th scope="col" className="govuk-table__header">
                  Purpose
                </th>
                <th scope="col" className="govuk-table__header">
                  Expires
                </th>
              </tr>
            </thead>
            <tbody className="govuk-table__body">
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  _ga
                </th>
                <td className="govuk-table__cell">Used to distinguish users</td>
                <td className="govuk-table__cell">2 years</td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  _ga_[container-id]
                </th>
                <td className="govuk-table__cell">
                  Used to persist session state
                </td>
                <td className="govuk-table__cell">2 years</td>
              </tr>
            </tbody>
          </table>
          <div className="govuk-form-group">
            <fieldset className="govuk-fieldset" aria-describedby="cookie-hint">
              <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                Do you want to accept analytics cookies?
              </legend>
              <div className="govuk-radios">
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="accept-cookies-yes"
                    name="accept-cookies"
                    type="radio"
                    value="yes"
                    checked={choice === "yes"}
                    onChange={() => setChoice("yes")}
                  />
                  <label
                    className="govuk-label govuk-radios__label"
                    htmlFor="accept-cookies-yes"
                  >
                    Yes
                  </label>
                </div>
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="accept-cookies-no"
                    name="accept-cookies"
                    type="radio"
                    value="no"
                    checked={choice === "no"}
                    onChange={() => setChoice("no")}
                  />
                  <label
                    className="govuk-label govuk-radios__label"
                    htmlFor="accept-cookies-no"
                  >
                    No
                  </label>
                </div>
              </div>
            </fieldset>
          </div>
          <button className="govuk-button" type="button" onClick={onSave}>
            Save cookie settings
          </button>
          {!isAuthenticated ? (
            <div>
              <Link className="govuk-link" href="/login">
                Back to login
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </BaseLayout>
  );
};

export default CookiesPage;
