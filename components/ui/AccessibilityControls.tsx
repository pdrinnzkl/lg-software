"use client";

import { Eye, Sun, Moon, Contrast, Type } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "contrast" | "warm";

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Modo claro", icon: Sun },
  { id: "dark", label: "Modo escuro", icon: Moon },
  { id: "contrast", label: "Alto contraste", icon: Contrast },
  { id: "warm", label: "Conforto visual", icon: Eye },
];

function setDocumentPreference(name: string, value: string) {
  document.documentElement.setAttribute(name, value);
}

export function AccessibilityControls() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [largeText, setLargeText] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("lgf-theme") as Theme | null;
    const savedText = window.localStorage.getItem("lgf-large-text");
    const nextTheme: Theme = themes.some((item) => item.id === savedTheme)
      ? savedTheme!
      : "light";
    const nextLargeText = savedText === "true";
    const frame = window.requestAnimationFrame(() => {
      setTheme(nextTheme);
      setLargeText(nextLargeText);
      setDocumentPreference("data-theme", nextTheme);
      setDocumentPreference("data-large-text", String(nextLargeText));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    setDocumentPreference("data-theme", nextTheme);
    window.localStorage.setItem("lgf-theme", nextTheme);
  }

  function toggleText() {
    const next = !largeText;
    setLargeText(next);
    setDocumentPreference("data-large-text", String(next));
    window.localStorage.setItem("lgf-large-text", String(next));
  }

  return (
    <div className="accessibility-tools">
      <section
        id="accessibility-panel"
        className="accessibility-panel"
        aria-label="Aparência e leitura"
        hidden={!open}
      >
        <p>APARÊNCIA E LEITURA</p>
        {themes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={theme === id ? "is-selected" : ""}
            aria-pressed={theme === id}
            onClick={() => selectTheme(id)}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
            {theme === id && <span className="accessibility-check">Ativo</span>}
          </button>
        ))}
        <button
          type="button"
          className={largeText ? "is-selected" : ""}
          aria-pressed={largeText}
          onClick={toggleText}
        >
          <Type size={18} aria-hidden="true" />
          <span>Aumentar texto</span>
          {largeText && <span className="accessibility-check">Ativo</span>}
        </button>
        <small>A preferência fica salva neste dispositivo.</small>
      </section>
      <button
        type="button"
        className="accessibility-trigger"
        aria-expanded={open}
        aria-controls="accessibility-panel"
        aria-label={
          open ? "Fechar opções de leitura" : "Opções de leitura e contraste"
        }
        onClick={() => setOpen((value) => !value)}
      >
        <Eye size={20} aria-hidden="true" />
        <span>Acessibilidade</span>
      </button>
    </div>
  );
}
