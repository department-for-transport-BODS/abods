import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import tippy from "tippy.js";

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
    });

    return () => {
      instance.destroy();
    };
  }, [message]);

  const classNames =
    `tooltip ${as === "button" ? "unbuttoned " : ""}${underline ? "tooltip--underline " : ""}${selectable ? "tooltip--selectable " : ""}${className ?? ""}`.trim();

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
