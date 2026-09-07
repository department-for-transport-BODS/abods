import styles from "./panel.module.scss";
import { usePanel } from "@/contexts/PanelContext";
import { clsx } from "clsx";

export const Panel = () => {
  const { isOpen, content } = usePanel();

  return (
    <div id="panel" className={clsx(styles.panel, isOpen && styles.open)}>
      {content}
    </div>
  );
};
