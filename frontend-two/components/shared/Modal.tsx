import { ReactNode, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { CrossIcon } from "@/components/icons/CrossIcon";
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
              <CrossIcon className="shared-modal__close-icon" />
            </button>
          ) : null}
        </div>
        <div className="shared-modal__body">
          <h2 className="govuk-heading-l" id={titleId}>
            {title}
          </h2>
          {description ? <p className="govuk-body">{description}</p> : null}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
