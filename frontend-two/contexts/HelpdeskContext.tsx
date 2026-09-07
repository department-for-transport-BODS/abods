import React, { createContext, useContext, useState, useCallback } from "react";
import { useConfig } from "@/contexts/ConfigContext";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  FreshdeskArticle,
  HelpdeskContextType,
  HelpdeskData,
} from "@/types/helpdesk";

const FRESHDESK_ARTICLE_STATUS_PUBLISHED = 2;
const SUPPORT_EMAIL_PLACEHOLDER = /\{\{SUPPORT_EMAIL\}\}/g;

const HelpdeskContext = createContext<HelpdeskContextType | undefined>(
  undefined,
);

export const HelpdeskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { config } = useConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<HelpdeskData | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const loadData = useCallback(
    async (folder: string, title: string) => {
      const freshdesk = config?.freshdesk;
      const folderId = freshdesk?.folders?.[folder];

      if (!freshdesk || !folder || !folderId) {
        setData({ title, articles: [] });
        return;
      }

      try {
        const response = await fetch(`${freshdesk.apiUrl}/${folderId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch Freshdesk folder "${folder}" (${response.status})`,
          );
        }
        const articles: FreshdeskArticle[] = await response.json();
        const supportEmail = config?.supportEmail ?? "";
        const publishedArticles = articles
          .filter(
            (article) => article.status === FRESHDESK_ARTICLE_STATUS_PUBLISHED,
          )
          .map((article) => ({
            ...article,
            description: article.description.replace(
              SUPPORT_EMAIL_PLACEHOLDER,
              supportEmail,
            ),
          }));

        setData({ title, articles: publishedArticles });
      } catch (error) {
        console.error("Failed to load helpdesk data:", error);
        setData({ title, articles: [] });
      }
    },
    [config],
  );

  useBodyScrollLock(isOpen, "helpdesk-open");

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
