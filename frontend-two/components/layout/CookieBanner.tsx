import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

export const CookieBanner = () => {
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
  const [policy, setPolicy] = useState<CookiePolicy>(defaultPolicy);

  useEffect(() => {
    setPolicy(loadPolicy(defaultPolicy));
  }, [defaultPolicy]);

  const updatePolicy = (analyticsEnabled: boolean) => {
    const updated = { ...policy, analyticsEnabled, userSubmitted: true };
    setPolicy(updated);
    savePolicy(updated);
  };

  if (policy.userSubmitted) {
    return null;
  }

  return (
    <section
      className="govuk-cookie-banner"
      aria-label="Cookies on Analyse Bus Open Data"
    >
      <div className="govuk-cookie-banner__message govuk-width-container">
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds">
            <h2 className="govuk-cookie-banner__heading govuk-heading-m">
              Cookies on Analyse Bus Open Data
            </h2>
            <div className="govuk-cookie-banner__content">
              <p className="govuk-body">
                We use some essential cookies to make this service work. We’d
                also like to use analytics cookies so we can understand how you
                use the service and make improvements.
              </p>
            </div>
          </div>
        </div>
        <div className="govuk-button-group">
          <button
            className="govuk-button"
            type="button"
            onClick={() => updatePolicy(true)}
          >
            Accept analytics cookies
          </button>
          <button
            className="govuk-button govuk-button--secondary"
            type="button"
            onClick={() => updatePolicy(false)}
          >
            Reject analytics cookies
          </button>
          <Link className="govuk-link" href="/cookies">
            View cookies
          </Link>
        </div>
      </div>
    </section>
  );
};
