"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as typeof theme ?? "system";
    setTheme(saved);
    apply(saved);
  }, []);

  const apply = (t: typeof theme) => {
    if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else if (t === "light") document.documentElement.removeAttribute("data-theme");
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
    }
  };

  const cycle = () => {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    localStorage.setItem("theme", next);
    apply(next);
  };

  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "⚙";
  return (
    <button onClick={cycle} title={`Theme: ${theme}`} style={{ background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 6, padding: "4px 8px", fontSize: 13, color: "var(--text-muted)", transition: "all 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
      {icon}
    </button>
  );
}
