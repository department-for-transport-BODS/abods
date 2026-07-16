import { useState } from "react";
import QuestionInCircleIcon from "@/assets/icons/question-in-circle.svg";
import { OnTimeHelpdeskPanel } from "./OnTimeHelpdeskPanel";

export const OnTimeHelpdeskButton = () => {
  const [isHelpdeskOpen, setIsHelpdeskOpen] = useState(false);

  return (
    <>
      <button
        className="helpdesk-link govuk-body govuk-link button-link"
        style = {{ textDecoration: "underline" }}
        onClick={() => setIsHelpdeskOpen(true)}
        type="button"
      >
        <QuestionInCircleIcon aria-hidden width="20" height="20" />
        How are these numbers calculated?
      </button>
      <OnTimeHelpdeskPanel
        isOpen={isHelpdeskOpen}
        onClose={() => setIsHelpdeskOpen(false)}
      />
    </>
  );
};
