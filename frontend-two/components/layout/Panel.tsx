import { usePanel } from "@/contexts/PanelContext";

export const Panel = () => {
  const { isOpen, content } = usePanel();

  return (
    <div id="panel" className={`panel ${isOpen ? "panel--open" : ""}`}>
      {content}
    </div>
  );
};
