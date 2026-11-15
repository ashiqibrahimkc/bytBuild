"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none ${className}`}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}

