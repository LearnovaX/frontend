// src/components/common/ThemeContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  ReactNode,
  useCallback,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  actualTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_KEY = "theme";

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize with system theme to prevent FOUC
  const [theme, setThemeState] = useState<Theme>("system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");
  const [isInitialized, setIsInitialized] = useState(false);

  const getSystemTheme = (): "light" | "dark" =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  // Apply theme to DOM
  const applyResolvedTheme = useCallback((resolved: "light" | "dark") => {
    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove("dark", "light");
    
    // Add the appropriate class
    root.classList.add(resolved);
    
    // Set data-theme attribute
    root.setAttribute("data-theme", resolved);
    
    // Update state
    setActualTheme(resolved);
  }, []);

  // Initialize theme on component mount
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as Theme | null;
      const initialTheme = saved ?? "system";
      setThemeState(initialTheme);
      
      const resolved = initialTheme === "system" 
        ? getSystemTheme() 
        : (initialTheme as "light" | "dark");
      
      applyResolvedTheme(resolved);
    } catch {
      // Fallback to system theme
      const resolved = getSystemTheme();
      applyResolvedTheme(resolved);
    } finally {
      setIsInitialized(true);
    }
  }, [applyResolvedTheme]);

  // Listen to system changes when 'system' is selected
  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const isDark = "matches" in e ? e.matches : mq.matches;
      const resolved = isDark ? "dark" : "light";
      applyResolvedTheme(resolved);
    };

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler as EventListener);
      return () => mq.removeEventListener("change", handler as EventListener);
    } else {
      // @ts-ignore
      mq.addListener(handler);
      return () => {
        // @ts-ignore
        mq.removeListener(handler);
      };
    }
  }, [theme, applyResolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {
      // ignore localStorage errors
    }

    setThemeState(newTheme);

    const resolved = newTheme === "system" 
      ? getSystemTheme() 
      : (newTheme as "light" | "dark");
    
    applyResolvedTheme(resolved);
  };

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
  };

  // Prevent rendering until theme is initialized to avoid FOUC
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}