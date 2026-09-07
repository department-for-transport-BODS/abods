import { useEffect } from "react";

/**
 * Locks page scrolling (via a body class) while `active` is true, and
 * restores scrolling when it becomes false or the component unmounts.
 */
export function useBodyScrollLock(active: boolean, className: string) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.classList.toggle(className, active);

    return () => {
      document.body.classList.remove(className);
    };
  }, [active, className]);
}
