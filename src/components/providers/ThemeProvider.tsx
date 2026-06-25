"use client";

import { useEffect } from "react";

/** Applies the persisted theme on mount. Toggling lives in Settings. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem("calendr-theme");
    const prefersDark =
      window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  return <>{children}</>;
}

export function setTheme(dark: boolean) {
  localStorage.setItem("calendr-theme", dark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", dark);
}
