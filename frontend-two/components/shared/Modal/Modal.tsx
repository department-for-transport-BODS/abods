import { ReactNode, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./modal.module.scss";
import { CrossIcon } from "@/components/icons/CrossIcon";
import CrownLogo from "@/assets/icons/govuk-logotype-crown.svg";
import Trap from "@/components/shared/Trap";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

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

  useBodyScrollLock(open, "modal-open");

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className={styles.modal} role="presentation">
      <Trap active={open} onDeactivate={onClose}>
        <div
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className={styles.header}>
            <span className={styles.logo}>
              <CrownLogo />
            </span>
            {showCloseButton ? (
              <button
                type="button"
                aria-label={closeLabel}
                className={styles.close}
                onClick={onClose}
              >
                <CrossIcon className={styles.closeIcon} />
              </button>
            ) : null}
          </div>
          <div className={styles.body}>
            <h2 className="govuk-heading-l" id={titleId}>
              {title}
            </h2>
            {description ? <p className="govuk-body">{description}</p> : null}
            {children}
          </div>
        </div>
      </Trap>
    </div>,
    document.body,
  );
};
