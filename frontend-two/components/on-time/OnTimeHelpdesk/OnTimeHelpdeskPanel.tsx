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
    title: "How do we match Automatic Vehicle Location (AVL) data to schedules?",
    content: (
      <>
        <p className="govuk-body">
          AVL data is received from the vehicles and is automatically matched to journeys in the schedules supplied to BODS. Using various fields in the SIRI-VM data including "OperatorRef", "LineRef" and "DatedVehicleJourneyRef" the system will scan the schedules to find a match.
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
          As a vehicle travels along its journey, the system continually monitors its location against the stops in the schedules. If a vehicle is within a 70 meter radius of the stop, it's considered to be at the stop. The system will then continue to monitor the GPS point until there are two GPS points progressively moving away from the 70 meter radius of the stop. At this point it will then record the departure time as the last GPS point within the 70m zone (using the GPS timestamp provided in the SIRI-VM data).
        </p>
        <p className="govuk-body">
          If two GPS pings happen to "straddle" a stop but both are further than 70 meters from the stop location, the system will calculate the departure time using the geometry of the two GPS points against the stop position. It will then look at the timestamps of the GPS points to calculate when the vehicle was leaving the 70m zone.
        </p>
        <p>
          Finally, the system relies on regular GPS updates to calculate arrivals and departures. If there are infrequent pings and the system does not receive GPS data close to a stop, it will not calculate departure times for those stops. This is to avoid calculating an inaccurate time because of insufficient data.
        </p>
      </>
    ),
  },
  {
    id: "on-time-performance",
    title: "How do we calculate On Time Performance?",
    content: (
      <>
        <ol className="govuk-list govuk-list--number">
          <li>
            We calculate your punctuality figures by matching your static
            timetable data with your AVL feeds. Please see "How do we match
            Automatic Vehicle Location (AVL) data to schedules?" for more
            information.
          </li>
          <li>We ONLY include where a departure is recorded.</li>
          <li>
            We use the OTC definitions for early and late. Please see the Late,
            On-Time and Early sections for more information.
          </li>
        </ol>
      </>
    ),
  },
  // TODO: ADD HYPERLINKS
  {
    id: "late",
    title: "Late",
    content: (
      <p className="govuk-body">
        We calculate late buses as per the Traffic Commissioner's guidelines, which means anything over 5 minutes 59 seconds counts as late. If the bus was exactly 5m 59s late, it would count as on time, 6 minutes would count as late.
      </p>
    ),
  },
  {
    id: "early",
    title: "Early",
    content: (
      <p className="govuk-body">
        We calculate early buses as per the Traffic Commissioner's guidelines as anything that departs more than 1 minute before the scheduled departure. 1 minute early is on-time, 1 minute and 1 second early is classified as early.
      </p>
    ),
  },
  {
    id: "missing-data",
    title: "Missing Data",
    content: (
      <>
        <p className="govuk-body">
          We don't include missing data in your on-time percentages.
        </p>
        <p className="govuk-body">
          There are a few of reasons why you might be seeing missing journeys
          from ABODS:
        </p>
        <ol className="govuk-list govuk-list--number">
          <li>
            The static data was not correct in BODS, so ABODS wasn't able to
            match AVL to the static data.
          </li>
          <li>
            We didn't receive AVL data. This could be for many reasons: the
            ticket machine wasn't turned on, or the ticket machine didn't have
            signal and was not able to upload the data once reconnected. If
            this continues to be a problem we suggest you speak to your AVL
            supplier directly. We are working hard to ensure greater
            completeness of AVL data on ABODS!
          </li>
          <li>
            The line name in the static data and the AVL file don't match.
          </li>
          <li>We didn't receive enough AVL data around a stop.</li>
        </ol>
      </>
    ),
  },
  {
    id: "average-delay",
    title: "Average delay",
    content: (
      <>
        <p className="govuk-body">
          For the given set of filter data (i.e. date range, granularity (hour, day, or month), operator and line), the query will return:
        </p>
        <p className="govuk-body">
          <b>scheduled_departures:</b> total number of scheduled stop departures
        </p>
        <p className="govuk-body">
          <b>total_departures:</b> total number of actual stop departures observed
        </p>
        <p className="govuk-body">
          <b>total_delay:</b> sum of differences between actual and scheduled departure times (in seconds).
        </p>
        <p className="govuk-body">
          We can then formulate the average delay = <b>total_delay / total_departures</b>
        </p>
      </>
    ),
  },
  {
    id: "last-stops",
    title: "Last Stops",
    content: (
      <p className="govuk-body">
        On-time performance is currently calculated using departure times for all stops except for the last stop, where arrival time is used. The last stop in a journey will be reported as either on time or late based on its arrival time, never early.
      </p>
    ),
  },
];

const sectionHasRenderableContent = (
  section: OnTimeHelpdeskSection,
): boolean => section.content !== undefined && section.content !== null;

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
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(
    initialExpandedIds,
  );

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
            allSectionsExpanded ? " on-time-helpdesk-panel__toggle-all--expanded" : ""
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
                    isExpanded ? " on-time-helpdesk-panel__section-toggle--expanded" : ""
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