import Link from "next/link";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useAuth } from "@/hooks/useAuth";

const AccessibilityPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BaseLayout title="Accessibility statement - Analyse Bus Open Data">
      <h1 className="govuk-heading-xl">Accessibility statement</h1>
      <div className="govuk-grid-row govuk-body">
        <div className="govuk-grid-column-two-thirds">
          <p className="govuk-body">
            This statement applies to pages on{" "}
            <a
              className="govuk-link"
              rel="noopener noreferrer"
              target="_blank"
              href="https://analyse.bus-data.dft.gov.uk/"
            >
              analyse.bus-data.dft.gov.uk
            </a>
            .
          </p>
          <p className="govuk-body">
            This website is run by the Department for Transport. The text should
            be clear and simple to understand. You should be able to:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              zoom in up to 400% without the text spilling off the screen
              (except for the on-time performance page due to the charts which
              are not accessible by nature).
            </li>
            <li>
              navigate most of the website using just a keyboard (except for
              maps which are not essential to the functionality).
            </li>
            <li>
              listen to most of the website using a screen reader (including the
              most recent versions of NVDA but excluding the diagrams on the
              dashboard and on-time performance pages).
            </li>
            <li>
              interpret page information through access technology due to a
              consistent heading structure.
            </li>
            <li>
              access the site and use the associated services with Google
              Chrome, Internet Explorer, Safari, Opera, Firefox, and Edge.
            </li>
          </ul>
          <section>
            <p className="govuk-heading-m">How accessible this website is</p>
            <p className="govuk-body">
              Parts of this website are not fully accessible. For example:
            </p>
            <ul className="govuk-list govuk-list--bullet">
              <li>
                Maps are not picked up directly by the screen reader and cannot
                be navigated using only the keyboard
              </li>
              <li>
                Diagrams do not contain alt-text so the screen reader cannot
                convey the meaning of graphics found across the website
              </li>
              <li>
                There is a keyboard trap experienced while using the date picker
              </li>
              <li>
                Colour alone is used to differentiate between on-time, late, and
                early departures
              </li>
            </ul>
          </section>
          <section>
            <h2 className="govuk-heading-m">
              Feedback and contact information
            </h2>
            <p className="govuk-body">
              If you need information on this website in a different format like
              accessible PDF, large print, easy read, audio recording or
              braille:
            </p>
            <ul className="govuk-list govuk-list--bullet">
              <li>
                Email:{" "}
                <a className="govuk-link" href="mailto:BusOpenData@dft.gov.uk">
                  BusOpenData@dft.gov.uk
                </a>
              </li>
            </ul>

            <p className="govuk-body">
              We&apos;ll consider your request and get back to you in 3 working
              days.
            </p>
          </section>
          <section>
            <h2 className="govuk-heading-m">
              Reporting accessibility problems with this website
            </h2>
            <p className="govuk-body">
              We&apos;re always looking to improve the accessibility of this
              website. If you find any problems that are not listed on this page
              or you think we&apos;re not meeting the accessibility
              requirements, contact:{" "}
              <a className="govuk-link" href="mailto:BusOpenData@dft.gov.uk">
                BusOpenData@dft.gov.uk
              </a>
            </p>
          </section>
          <section>
            <h2 className="govuk-heading-m">Enforcement procedure</h2>
            <p className="govuk-body">
              The Equality and Human Rights Commission (EHRC) is responsible for
              enforcing the Public Sector Bodies (Websites and Mobile
              Applications) (No. 2) Accessibility Regulations 2018 (the
              “accessibility regulations”). If you&apos;re not happy with how we
              respond to your complaint,{" "}
              <a
                className="govuk-link"
                rel="noopener noreferrer"
                target="_blank"
                href="https://www.equalityadvisoryservice.com/"
              >
                contact the Equality Advisory and Support Service (EASS).
              </a>
            </p>
          </section>
          <section>
            <h2 className="govuk-heading-m">
              Technical information about this website&apos;s accessibility
            </h2>
            <p className="govuk-body">
              Department for Transport is committed to making its websites
              accessible, in accordance with the Public Sector Bodies (Websites
              and Mobile Applications) (No. 2) Accessibility Regulations 2018.
            </p>
          </section>
          <section>
            <h2 className="govuk-heading-m">Non-accessible content</h2>
            <p className="govuk-body govuk-!-font-weight-bold">
              The content listed below is known to be non-accessible for the
              given reasons. Fixes for each are on the project roadmap.
            </p>
            <p className="govuk-body">
              Non-compliance with accessibility regulations
            </p>
            <ul className="govuk-list govuk-list--bullet">
              <li>
                Maps and Diagrams on the Dashboard and On-time performance pages
                do not have suitable image descriptions. Users of assistive
                technologies may not have access to information conveyed through
                the diagrams. Keyboard only users may also not be able to zoom
                on the maps. This fails WCAG 2.2 success criterion 1.1.1
                (Non-text Content).
              </li>
              <li>
                Some diagrams use colour as the only way to convey meaning. This
                fails WCAG 2.2 success criterion 1.4.1 (Use of Color).
              </li>
              <li>
                There is one case of poor colour contrast of an element to the
                background. This fails WCAG 2.2 success criterion 1.4.11
                (Non-text Contrast).
              </li>
              <li>
                The text on some buttons doesn&apos;t accurately describe what
                the button does. This fails WCAG 2.2 success criterion 2.4.6
                (Headings and Labels).
              </li>
              <li>
                There is one case of a keyboard trap whilst navigation the page
                and using the date picker. This fails WCAG 2.2 success criterion
                2.1.2 (No Keyboard Trap).
              </li>
            </ul>
          </section>
          <section>
            <h2 className="govuk-heading-m">
              Preparation of this accessibility statement
            </h2>
            <p className="govuk-body">
              This statement was prepared on 13 February 2025.
            </p>
            <p className="govuk-body">
              It was last reviewed on 14 February 2025.
            </p>
            <p className="govuk-body">
              This website was last tested on 6 February 2025.
            </p>
          </section>
          {!isAuthenticated ? (
            <Link className="govuk-link" href="/login">
              Back to login
            </Link>
          ) : null}
        </div>
      </div>
    </BaseLayout>
  );
};

export default AccessibilityPage;
