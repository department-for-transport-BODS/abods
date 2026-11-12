import styles from "./on-time-helpdesk-button.module.scss";

import QuestionInCircleIcon from "@/assets/icons/question-in-circle.svg";
import { useHelpdesk } from "@/contexts/HelpdeskContext";

export const OnTimeHelpdeskButton = () => {
  const { open: openHelpDesk } = useHelpdesk();

  return (
    <button
      className={`${styles.helpdeskLink} govuk-body govuk-link button-link`}
      style={{ textDecoration: "underline", textDecorationThickness: "1px" }}
      onClick={openHelpDesk}
      type="button"
    >
      <QuestionInCircleIcon />
      How are these numbers calculated?
    </button>
  );
};
