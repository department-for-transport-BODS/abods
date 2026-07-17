import { ReactNode, useMemo, useState } from "react";

export interface OnTimeHelpdeskSection {
  id: string;
  title: string;
  content?: ReactNode;
}

interface OnTimeHelpdeskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  sections?: OnTimeHelpdeskSection[];
  initiallyExpandedSectionIds?: string[];
}

const DEFAULT_SECTIONS: OnTimeHelpdeskSection[] = [
  {
    id: "avl-to-schedules",
    title:
      "How do we match Automatic Vehicle Location (AVL) data to schedules?",
    content: (
      <>
        <p className="govuk-body">
          TODO: Put content here
        </p>
      </>
    ),
  },
  {
    id: "arrival-and-departure-times",
    title: "How do we calculate Arrival and Departure times?",
    content: (
      <>
        <p className="govuk-body">
          TODO: Put content here
        </p>
      </>
    ),
  },
  {
    id: "on-time-performance",
    title: "How do we calculate On Time Performance?",
    content: (
      <>
        <p className="govuk-body">
          TODO: Put content here
        </p>
      </>
    ),
  },
  // TODO: ADD HYPERLINKS
  {
    id: "late",
    title: "Late",
    content: (
      <>
        <p className="govuk-body">
          TODO: Put content here
        </p>
      </>
    ),
  },
  {
    id: "early",
    title: "Early",
    content: (
      <>
        <p className="govuk-body">
          TODO: Put content here
        </p>
      </>
    ),
  },
  {
    id: "missing-data",
    title: "Missing Data",
    content: (
      <>
        <p className="govuk-body">
          TODO: Put content here
        </p>
      </>
    ),
  },
  {
    id: "average-delay",
    title: "Average delay",
    content: (
      <>
        <p className="govuk-body">
          TODO: Put content here
        </p>
      </>
    ),
  },
  {
    id: "last-stops",
    title: "Last Stops",
    content: (
      <>
        <p className="govuk-body">
          TODO: Put content here
        </p>
      </>
    ),
  },
];

const sectionHasRenderableContent = (section: OnTimeHelpdeskSection): boolean =>
  section.content !== undefined && section.content !== null;

export const OnTimeHelpdeskPanel = ({
  isOpen,
  onClose,
  title = "On-time performance",
  sections = DEFAULT_SECTIONS,
  initiallyExpandedSectionIds,
}: OnTimeHelpdeskPanelProps) => {
  const initialExpandedIds = useMemo(
    () => new Set(initiallyExpandedSectionIds ?? []),
    [initiallyExpandedSectionIds],
  );
  const [expandedSectionIds, setExpandedSectionIds] =
    useState<Set<string>>(initialExpandedIds);

  if (!isOpen) {
    return null;
  }

  const allExpandableSectionIds = sections
    .filter(sectionHasRenderableContent)
    .map((section) => section.id);
  const allSectionsExpanded =
    allExpandableSectionIds.length > 0 &&
    allExpandableSectionIds.every((id) => expandedSectionIds.has(id));

  const toggleSection = (sectionId: string) => {
    setExpandedSectionIds((previous) => {
      const updated = new Set(previous);
      if (updated.has(sectionId)) {
        updated.delete(sectionId);
      } else {
        updated.add(sectionId);
      }
      return updated;
    });
  };

  const toggleAllSections = () => {
    setExpandedSectionIds(() => {
      if (allSectionsExpanded) {
        return new Set<string>();
      }

      return new Set(allExpandableSectionIds);
    });
  };

  return (
    <div className="on-time-helpdesk-panel-drawer" role="presentation">
      <button
        type="button"
        className="on-time-helpdesk-panel-drawer__backdrop"
        aria-label="Close on-time performance helpdesk panel"
        onClick={onClose}
      />

      <div
        className="on-time-helpdesk-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="on-time-helpdesk-panel__header">
          <h2 className="govuk-heading-l govuk-!-margin-bottom-0">{title}</h2>
          <button
            type="button"
            className="on-time-helpdesk-panel__close button-link govuk-link"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <button
          type="button"
          className={`on-time-helpdesk-panel__toggle-all button-link govuk-link${
            allSectionsExpanded
              ? " on-time-helpdesk-panel__toggle-all--expanded"
              : ""
          }`}
          onClick={toggleAllSections}
          disabled={allExpandableSectionIds.length === 0}
        >
          {allSectionsExpanded ? "Hide all sections" : "Show all sections"}
        </button>

        <div className="on-time-helpdesk-panel__sections">
          {sections.map((section) => {
            const isExpandable = sectionHasRenderableContent(section);
            const isExpanded = expandedSectionIds.has(section.id);

            return (
              <section
                key={section.id}
                className="on-time-helpdesk-panel__section"
              >
                <h3 className="govuk-heading-m govuk-!-margin-bottom-2">
                  {section.title}
                </h3>
                <button
                  type="button"
                  className={`on-time-helpdesk-panel__section-toggle button-link govuk-link${
                    isExpanded
                      ? " on-time-helpdesk-panel__section-toggle--expanded"
                      : ""
                  }`}
                  onClick={() => toggleSection(section.id)}
                  disabled={!isExpandable}
                  aria-expanded={isExpanded}
                  aria-controls={`on-time-helpdesk-panel-content-${section.id}`}
                >
                  {isExpanded ? "Hide" : "Show"}
                </button>

                {isExpanded && isExpandable ? (
                  <div
                    id={`on-time-helpdesk-panel-content-${section.id}`}
                    className="on-time-helpdesk-panel__section-content govuk-body"
                  >
                    {section.content}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
