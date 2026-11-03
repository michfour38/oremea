"use client";

import { useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "oremea_compass_appearance";
type CompassMode = "dark" | "light";

/** A customer preference, not a partner brand or a change to Compass artwork. */
export function CompassAppearance({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CompassMode>("dark");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") setMode(stored);
    } catch {
      // Blocking browser storage must not prevent Compass from rendering.
    }
  }, []);

  function toggle() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference still works for this visit when browser storage is disabled.
    }
  }

  return (
    <div className="compass-appearance" data-compass-mode={mode}>
      {children}
      <button
        type="button"
        className="compass-appearance-toggle"
        onClick={toggle}
        aria-label={mode === "dark" ? "Switch Compass to light mode" : "Switch Compass to dark mode"}
        aria-pressed={mode === "light"}
      >
        {mode === "dark" ? "Light mode" : "Dark mode"}
      </button>
    </div>
  );
}
