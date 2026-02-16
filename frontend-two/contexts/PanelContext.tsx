import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PanelContextType {
  isOpen: boolean;
  content: ReactNode | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setContent: (content: ReactNode) => void;
  destroy: () => void;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export const PanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const destroy = useCallback(() => {
    setIsOpen(false);
    setContent(null);
  }, []);

  return (
    <PanelContext.Provider
      value={{ isOpen, content, open, close, toggle, setContent, destroy }}
    >
      {children}
    </PanelContext.Provider>
  );
};

export const usePanel = () => {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error('usePanel must be used within a PanelProvider');
  }
  return context;
};
