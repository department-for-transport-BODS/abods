import React, { useEffect, useRef } from "react";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { useConfig } from "@/contexts/ConfigContext";

const HelpdeskPanel: React.FC = () => {
  const { isOpen, data, close } = useHelpdesk();
  const { config } = useConfig();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, close]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener("mouseup", handleClickOutside);
    }

    return () => document.removeEventListener("mouseup", handleClickOutside);
  }, [isOpen, close]);

  return (
    <>
      <div
        className={`helpdesk-overlay ${isOpen ? "helpdesk-overlay--open" : ""}`}
      />
      <div
        ref={panelRef}
        className={`helpdesk-panel ${isOpen ? "helpdesk-panel--open" : ""}`}
      >
        <div className="helpdesk-panel__heading">
          <h2 className="govuk-heading-l">{data?.title}</h2>
          <button
            type="button"
            className="helpdesk-panel__close-button button-link govuk-link"
            onClick={close}
          >
            Close
          </button>
        </div>

        {data?.articles && data.articles.length > 0 ? (
          <div className="govuk-accordion" data-module="govuk-accordion">
            {data.articles.map((article) => (
              <div key={article.id} className="govuk-accordion__section">
                <div className="govuk-accordion__section-header">
                  <h2 className="govuk-accordion__section-heading">
                    <button
                      type="button"
                      className="govuk-accordion__section-button"
                      aria-expanded="false"
                    >
                      {article.title}
                    </button>
                  </h2>
                  {article.seo_data.meta_description && (
                    <div className="govuk-accordion__section-summary govuk-body">
                      {article.seo_data.meta_description}
                    </div>
                  )}
                </div>
                <div className="govuk-accordion__section-content">
                  <div
                    className="govuk-body"
                    dangerouslySetInnerHTML={{ __html: article.description }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <h2>Sorry, there are no help articles for this section</h2>
            <div className="govuk-body">
              <p>We are working on adding more.</p>
              <p>
                If you have any questions or would like to leave feedback please
                email{" "}
                <a
                  className="govuk-link"
                  href={`mailto:${config?.supportEmail || ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {config?.supportEmail || ""}
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HelpdeskPanel;
