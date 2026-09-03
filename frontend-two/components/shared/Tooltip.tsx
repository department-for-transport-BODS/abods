import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import tippy from "tippy.js";
import styles from "./tooltip.module.scss";
import { clsx } from "clsx";

interface TooltipProps {
  message?: ReactNode;
  underline?: boolean;
  selectable?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  as?: "button" | "span";
}

const getTooltipContent = (message: ReactNode) => {
  if (typeof message === "string") {
    return message;
  }

  return renderToStaticMarkup(<>{message}</>);
};

// Bulleted list for use inside a Tooltip `message`
export const TooltipList = ({ children }: { children: ReactNode }) => (
  <ul className={styles.list}>{children}</ul>
);

export const Tooltip = ({
  message,
  underline,
  selectable,
  onClick,
  className,
  children,
  as = "button",
}: TooltipProps) => {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!triggerRef.current || !message) {
      return;
    }

    const instance = tippy(triggerRef.current, {
      content: getTooltipContent(message),
      allowHTML: true,
      theme: "gds-tooltip",
      zIndex: 100,
      placement: "top",
      trigger: "mouseenter focus click",
      appendTo: () => document.body,
      popperOptions: {
        modifiers: [
          {
            name: "preventOverflow",
            options: {
              padding: 8,
              altAxis: true,
              boundary: "viewport",
            },
          },
        ],
      },
    });

    return () => {
      instance.destroy();
    };
  }, [message]);

  const classNames = clsx(
    styles.tooltip,
    as === "button" && "unbuttoned",
    underline && styles.underline,
    selectable && styles.selectable,
    className,
  );

  if (as === "span") {
    return (
      <span ref={triggerRef} className={classNames}>
        {children}
      </span>
    );
  }

  return (
    <button
      ref={triggerRef as RefObject<HTMLButtonElement>}
      className={classNames}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
