import styles from "./on-time-helpdesk-button.module.scss";

import { useState } from "react";
import QuestionInCircleIcon from "@/assets/icons/question-in-circle.svg";
import { OnTimeHelpdeskPanel } from "./OnTimeHelpdeskPanel";

export const OnTimeHelpdeskButton = () => {
  const [isHelpdeskOpen, setIsHelpdeskOpen] = useState(false);

  return (
    <>
      <button
        className={`${styles.helpdeskLink} govuk-body govuk-link button-link`}
        style={{ textDecoration: "underline", textDecorationThickness: "1px" }}
        onClick={() => setIsHelpdeskOpen(true)}
        type="button"
      >
        <QuestionInCircleIcon />
        How are these numbers calculated?
      </button>
      <OnTimeHelpdeskPanel
        isOpen={isHelpdeskOpen}
        onClose={() => setIsHelpdeskOpen(false)}
      />
    </>
  );
};
