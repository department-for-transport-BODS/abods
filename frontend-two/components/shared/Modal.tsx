import { ReactNode, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  description?: ReactNode;
  closeLabel?: string;
  showCloseButton?: boolean;
}

export const Modal = ({
  open,
  title,
  children,
  onClose,
  description,
  closeLabel = "Close",
  showCloseButton = true,
}: ModalProps) => {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.classList.add("modal-open");
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className="shared-modal" role="presentation" onClick={onClose}>
      <div
        className="shared-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shared-modal__header">
          <h2 className="govuk-heading-m govuk-!-margin-bottom-0" id={titleId}>
            {title}
          </h2>
          {showCloseButton ? (
            <button
              type="button"
              className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0 shared-modal__close"
              onClick={onClose}
            >
              {closeLabel}
            </button>
          ) : null}
        </div>
        {description ? (
          <div className="govuk-body govuk-!-margin-top-3 govuk-!-margin-bottom-3">
            {description}
          </div>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
};