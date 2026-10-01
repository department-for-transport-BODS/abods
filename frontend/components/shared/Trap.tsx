import { ReactNode, useEffect, useState } from "react";
import { FocusTrap } from "focus-trap-react";

interface TrapProps {
  active: boolean;
  children: ReactNode;
  className?: string;
  onDeactivate?: () => void;
}

const Trap = ({ active, children, className, onDeactivate }: TrapProps) => {
  const [trapActive, setTrapActive] = useState(false);

  useEffect(() => {
    setTrapActive(active);
  }, [active]);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <FocusTrap
      active={trapActive}
      focusTrapOptions={{
        tabbableOptions: { displayCheck: "none" },
        escapeDeactivates: true,
        clickOutsideDeactivates: true,
        onDeactivate,
      }}
    >
      <div className={className}>{children}</div>
    </FocusTrap>
  );
};

export default Trap;
