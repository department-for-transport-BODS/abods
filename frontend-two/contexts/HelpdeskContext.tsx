import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

interface FreshdeskArticle {
  id: string;
  type: number;
  status: number;
  agent_id: number;
  created_at: string;
  category_id: number;
  folder_id: number;
  title: string;
  updated_at: string;
  description: string;
  description_text: string;
  seo_data: {
    meta_title: string;
    meta_description: string;
  };
  tags: any[];
  attachments: any[];
  cloud_files: any[];
  thumbs_up: number;
  thumbs_down: number;
  hits: number;
  suggested: number;
  feedback_count: number;
}

interface HelpdeskData {
  title: string;
  articles: FreshdeskArticle[];
}

interface HelpdeskContextType {
  isOpen: boolean;
  data: HelpdeskData | null;
  open: () => void;
  close: () => void;
  loadData: (folder: string, title: string) => Promise<void>;
}

const HelpdeskContext = createContext<HelpdeskContextType | undefined>(
  undefined,
);

export const HelpdeskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<HelpdeskData | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    if (typeof document !== "undefined") {
      document.body.classList.add("helpdesk-open");
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (typeof document !== "undefined") {
      document.body.classList.remove("helpdesk-open");
    }
  }, []);

  const loadData = useCallback(async (folder: string, title: string) => {
    try {
      // TODO: For now, set empt data - API later. For now enpty fine (ptl ticket? + cleanup here)
      setData({
        title,
        articles: [],
      });
    } catch (error) {
      console.error("Failed to load helpdesk data:", error);
      setData({
        title,
        articles: [],
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("helpdesk-open");
      }
    };
  }, []);

  return (
    <HelpdeskContext.Provider value={{ isOpen, data, open, close, loadData }}>
      {children}
    </HelpdeskContext.Provider>
  );
};

export const useHelpdesk = () => {
  const context = useContext(HelpdeskContext);
  if (context === undefined) {
    throw new Error("useHelpdesk must be used within a HelpdeskProvider");
  }
  return context;
};
