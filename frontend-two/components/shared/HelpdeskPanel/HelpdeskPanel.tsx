import React, { useEffect, useId, useRef } from "react";
import styles from "./helpdesk-panel.module.scss";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { useConfig } from "@/contexts/ConfigContext";
import { formatFreshdeskHtml } from "@/utils/helpdesk";
import Trap from "@/components/shared/Trap";
import { clsx } from "clsx";

const HelpdeskPanel: React.FC = () => {
  const { isOpen, data, close } = useHelpdesk();
  const { config } = useConfig();
  const accordionRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen || !data?.articles.length || !accordionRef.current) {
      return;
    }

    const container = accordionRef.current;
    let cancelled = false;

    import("govuk-frontend")
      .then(({ Accordion }) => {
        if (!cancelled) {
          new Accordion(container, { rememberExpanded: false });
        }
      })
      .catch((error) => {
        console.error("Failed to initialise helpdesk accordion:", error);
      });

    return () => {
      cancelled = true;
      container.removeAttribute("data-govuk-accordion-init");
    };
  }, [isOpen, data]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className={clsx(styles.overlay, styles.overlayOpen)} />
      <Trap active={isOpen} onDeactivate={close}>
        <div
          className={clsx(styles.panel, styles.panelOpen)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className={styles.heading}>
            <h2 id={titleId} className="govuk-heading-l">
              {data?.title}
            </h2>
            <button
              type="button"
              className={clsx(styles.closeButton, "button-link", "govuk-link")}
              onClick={close}
              aria-label={`Close ${data?.title ?? "help"} panel`}
            >
              Close
            </button>
          </div>

          {data?.articles && data.articles.length > 0 ? (
            <div
              ref={accordionRef}
              className="govuk-accordion"
              data-module="govuk-accordion"
            >
              {data.articles.map((article) => (
                <div key={article.id} className="govuk-accordion__section">
                  <div className="govuk-accordion__section-header">
                    <h3 className="govuk-accordion__section-heading">
                      <button
                        type="button"
                        className="govuk-accordion__section-button"
                        aria-expanded="false"
                      >
                        {article.title}
                      </button>
                    </h3>
                    {article.seo_data.meta_description && (
                      <div className="govuk-accordion__section-summary govuk-body">
                        {article.seo_data.meta_description}
                      </div>
                    )}
                  </div>
                  <div className="govuk-accordion__section-content" hidden>
                    <div
                      className="govuk-body"
                      dangerouslySetInnerHTML={{
                        __html: formatFreshdeskHtml(article.description),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h3>Sorry, there are no help articles for this section</h3>
              <div className="govuk-body">
                {config?.supportEmail && (
                  <p>
                    If you have any questions or would like to leave feedback
                    please email{" "}
                    <a
                      className="govuk-link"
                      href={`mailto:${config.supportEmail}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {config.supportEmail}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Trap>
    </>
  );
};

export default HelpdeskPanel;
