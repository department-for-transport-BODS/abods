import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { ConfigObject } from "@/types";
import { fetchConfig } from "@/utils/config";

interface ConfigContextValue {
  config: ConfigObject | null;
  isLoading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ConfigObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchConfig();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load config");
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const value = useMemo(
    () => ({ config, isLoading, error }),
    [config, isLoading, error],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextValue => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within ConfigProvider");
  }
  return context;
};
