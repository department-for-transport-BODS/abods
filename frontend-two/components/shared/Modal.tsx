import { ReactNode, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import CrownLogo from "@/assets/icons/govuk-logotype-crown.svg";

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
          <span className="shared-modal__logo">
            <CrownLogo />
          </span>
          {showCloseButton ? (
            <button
              type="button"
              aria-label={closeLabel}
              className="shared-modal__close"
              onClick={onClose}
            >
              <svg
                aria-hidden="true"
                focusable="false"
                className="shared-modal__close-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 13 13"
                width="32"
                height="32"
              >
                <path
                  fill="currentColor"
                  d="M.7 11.3L5.5 6 .7.7 1.4 0 6.2 4.8 11 .1l.7.7L6.9 6l4.8 5.3-.7.7L6.2 7.2 1.4 12l-.7-.7z"
                />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="shared-modal__body">
          <h2 className="govuk-heading-m govuk-!-margin-bottom-0" id={titleId}>
            {title}
          </h2>
          {description ? (
            <div className="govuk-body govuk-!-margin-top-3 govuk-!-margin-bottom-3">
              {description}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
