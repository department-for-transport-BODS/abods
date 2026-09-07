import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface NavContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

const setBodyNavOpen = (open: boolean) => {
  document.body.classList.toggle("js-nav-open", open);
};

export const NavProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<NavContextType>(
    () => ({
      isOpen,
      toggle: () =>
        setIsOpen((prev) => {
          const next = !prev;
          setBodyNavOpen(next);
          return next;
        }),
      close: () => {
        setIsOpen(false);
        setBodyNavOpen(false);
      },
    }),
    [isOpen],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
};

export const useNav = () => {
  const context = useContext(NavContext);
  if (context === undefined) {
    throw new Error("useNav must be used within a NavProvider");
  }
  return context;
};
