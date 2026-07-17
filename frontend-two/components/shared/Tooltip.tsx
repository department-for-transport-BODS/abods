import { ReactNode, useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import tippy from "tippy.js";

interface TooltipProps {
  message?: ReactNode;
  underline?: boolean;
  selectable?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
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
}: TooltipProps) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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

  return (
    <button
      ref={triggerRef}
      className={`unbuttoned tooltip ${underline ? "tooltip--underline" : ""} ${selectable ? "tooltip--selectable" : ""} ${className ?? ""}`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
