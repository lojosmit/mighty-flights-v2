"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");
    const next = !html.classList.contains("dark");
    html.classList.toggle("dark", next);
    localStorage.setItem("mf-theme", next ? "dark" : "light");
    setDark(next);
    setTimeout(() => html.classList.remove("theme-transitioning"), 420);
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--ink-tertiary)",
        padding: 0,
      }}
    >
      {dark ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
    </button>
  );
}
