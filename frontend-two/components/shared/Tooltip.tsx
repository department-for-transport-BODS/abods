import { ReactNode, useEffect, useRef } from "react";
import tippy from "tippy.js";

interface TooltipProps {
  message?: string;
  underline?: boolean;
  selectable?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

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
      content: message,
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
      className={`unbuttoned tooltip ${underline ? "tooltip--underline" : ""} ${selectable ? "tooltip--selectable" : ""}`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
