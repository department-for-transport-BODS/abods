import Link from "next/link";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";

const PrivacyPolicyPage = () => {
  const { isAuthenticated } = useAuth();
  const { config } = useConfig();

  return (
    <BaseLayout title="Privacy - Analyse Bus Open Data">
      <h1 className="govuk-heading-xl govuk-!-margin-top-2 govuk-!-margin-bottom-6">
        Privacy
      </h1>
      <div className="govuk-grid-row govuk-body">
        <div className="govuk-grid-column-two-thirds">
          <div className="govuk-body-s">Last updated: 30 May, 2022</div>
          <h2 className="govuk-heading-m">Who we are</h2>
          <p className="govuk-body">
            Analyse Bus Open Data is part of the Department for Transport&apos;s
            ongoing investment in bus services, and supports the National Bus
            Strategy by helping government, local authorities, and bus operators
            to:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              perform existing bus data analysis in faster and easier ways
            </li>
            <li>
              produce more accurate and detailed performance analysis reports
            </li>
            <li>improve collaboration between different organisations</li>
            <li>identify network improvement opportunities</li>
            <li>
              inform transport policy and compliance monitoring across the
              industry
            </li>
          </ul>
          <p className="govuk-body">
            The service is provided by the Department for Transport.
          </p>
          <h2 className="govuk-heading-m">What data we collect from you</h2>
          <p className="govuk-body">
            Our main purpose is providing analysis of the bus services
            contributing to the{" "}
            <a className="govuk-link" href={`${config?.bodsBaseUrl}/`}>
              Bus Open Data Service
            </a>
            . Local bus services data across England is in the public domain and
            utilised responsibly. This data is provided by users, including bus
            operators, Local Authorities, agents, consumers, or anyone who has
            signed up to use the service.
          </p>
          <p className="govuk-body">
            The personal data we collect from you includes:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              your questions, queries or feedback and email address if you
              contact us
            </li>
            <li>
              your first name, last name, email address and organisation when
              registering with the service
            </li>
            <li>
              your Internet Protocol (IP) address, and web browser version
            </li>
            <li>
              information on how you use the site, using cookies and page
              tagging
            </li>
          </ul>
          <p className="govuk-body">
            We use Google Analytics to collect information about how you use
            this service. This includes IP addresses. The data is anonymised
            before being used for analytics processing. Google Analytics
            processes anonymised information about:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>the pages you visit</li>
            <li>how long you spend on each page</li>
            <li>how you got to the site</li>
            <li>what you click on while you&apos;re visiting the site</li>
          </ul>
          <p className="govuk-body">
            We do not store your personal information through Google Analytics
            (for example your name or address).
          </p>
          <p className="govuk-body">
            We will not identify you through analytics information, and we will
            not combine analytics information with other data sets in a way that
            would identify who you are.
          </p>
          <h2 className="govuk-heading-m">What we do with your data</h2>
          <p className="govuk-body">
            We use your data to calculate website performance metrics to support
            continuous improvement of the service.
          </p>
          <p className="govuk-body">We also collect data in order to:</p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              reply to any feedback or support requests you send us, if
              you&apos;ve asked us to
            </li>
            <li>send email notifications to users who request them</li>
          </ul>
          <p className="govuk-body">We will not:</p>
          <ul className="govuk-list govuk-list--bullet">
            <li>sell or rent your data to third parties</li>
            <li>share your data with third parties for marketing purposes</li>
          </ul>
          <p className="govuk-body">
            We will share your data if we are required to do so by law - for
            example, by court order, or to prevent fraud or other crime.
          </p>
          <h2 className="govuk-heading-m">How long we keep your data for</h2>
          <p className="govuk-body">
            We will retain your data for as long as you have an ABODS account.
          </p>
          <h2 className="govuk-heading-m">
            Where your data is processed and stored
          </h2>
          <p className="govuk-body">
            We design, build and run our systems to make sure that your data is
            as safe as possible at any stage, both while it&apos;s processed and
            when it&apos;s stored.
          </p>
          <p className="govuk-body">
            Your personal data will not be transferred outside of the European
            Economic Area (EEA).
          </p>
          <h2 className="govuk-heading-m">
            How we protect your data and keep it secure
          </h2>
          <p className="govuk-body">
            We are committed to doing all that we can to keep your data secure.
            To prevent unauthorised access or disclosure we have put in place
            technical and organisational procedures to secure the data we
            collect about you - for example, we protect your data using varying
            levels of encryption. We also make sure that any third parties that
            we deal with have an obligation to keep all personal data they
            process on our behalf secure.
          </p>
          <h2 className="govuk-heading-m">What are your rights</h2>
          <p className="govuk-body">You have the right to request:</p>
          <ul className="govuk-list govuk-list--bullet">
            <li>information about how your personal data is processed</li>
            <li>
              a copy of that personal data - this copy will be provided in a
              structured, commonly used and machine-readable format
            </li>
            <li>
              that anything inaccurate in your personal data is corrected
              immediately
            </li>
          </ul>
          <p className="govuk-body">You can also:</p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              raise an objection about how your personal data is processed
            </li>
            <li>
              request that your personal data is erased if there is no longer
              justification for it
            </li>
            <li>
              ask that the processing of your personal data is restricted in
              certain circumstances
            </li>
          </ul>
          <p className="govuk-body">
            If you have any of these requests, get in contact with our Data
            Protection Officer - you can find their contact details below.
          </p>
          <h2 className="govuk-heading-m">Changes to this notice</h2>
          <p className="govuk-body">
            We may modify or amend this privacy notice at our discretion at any
            time. When we make changes to this notice, we will amend the last
            modified date at the top of this page. Any modification or amendment
            to this privacy notice will be applied to you and your data as of
            that revision date. We encourage you to periodically review this
            privacy notice to be informed about how we are protecting your data.
          </p>
          <h2 className="govuk-heading-m">Contact us or make a complaint</h2>
          <p className="govuk-body">
            Contact the Data Protection Team if you either:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>have any questions about anything in this document</li>
            <li>think your personal data has been misused or mishandled</li>
          </ul>
          <div className="contact">
            <p className="govuk-body">
              Data Protection Team
              <br />
              <a
                className="govuk-link"
                href="mailto:DataProtectionOfficer@dft.gov.uk"
              >
                DataProtectionOfficer@dft.gov.uk
              </a>
            </p>
          </div>
          <p className="govuk-body">
            You can also contact the Cabinet Office Data Protection Officer.
          </p>
          <div className="contact">
            <p className="govuk-body">
              Data Protection Officer
              <br />
              <a className="govuk-link" href="mailto:DPO@cabinetoffice.gov.uk">
                DPO@cabinetoffice.gov.uk
              </a>
              <br />
              Data Protection Officer
              <br />
              Cabinet Office
              <br />
              70 Whitehall
              <br />
              London SW1A 2AS
            </p>
          </div>
          <p className="govuk-body">
            If you have a complaint, you can also contact the Information
            Commissioner&apos;s Office (ICO). The ICO is an independent
            regulator set up to uphold information rights.
          </p>
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

export default PrivacyPolicyPage;
