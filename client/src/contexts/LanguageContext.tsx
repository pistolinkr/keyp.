import React, { createContext, useContext, useEffect, useRef, useState } from "react";

export type Language = "ko" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  isLangTransitioning: boolean;
  langTransitionPhase: "idle" | "out" | "in";
}

const STORAGE_KEY = "keyp-language";
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({
  children,
  defaultLanguage = "ko",
}: LanguageProviderProps) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "ko" ? stored : defaultLanguage;
  });
  const [langTransitionPhase, setLangTransitionPhase] = useState<"idle" | "out" | "in">("idle");
  const switchTimeoutRef = useRef<number | null>(null);
  const settleTimeoutRef = useRef<number | null>(null);

  const LANG_OUT_MS = 120;
  const LANG_IN_MS = 180;

  const clearTransitionTimers = () => {
    if (switchTimeoutRef.current !== null) {
      window.clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }
    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
  };

  const setLang = (nextLang: Language) => {
    if (nextLang === lang || langTransitionPhase !== "idle") return;

    clearTransitionTimers();
    setLangTransitionPhase("out");

    switchTimeoutRef.current = window.setTimeout(() => {
      setLangState(nextLang);
      setLangTransitionPhase("in");

      settleTimeoutRef.current = window.setTimeout(() => {
        setLangTransitionPhase("idle");
      }, LANG_IN_MS);
    }, LANG_OUT_MS);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  useEffect(() => {
    if (langTransitionPhase === "idle") {
      document.documentElement.removeAttribute("data-lang-transition");
      return;
    }
    document.documentElement.setAttribute("data-lang-transition", langTransitionPhase);
  }, [langTransitionPhase]);

  useEffect(() => {
    return () => {
      clearTransitionTimers();
      document.documentElement.removeAttribute("data-lang-transition");
    };
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        isLangTransitioning: langTransitionPhase !== "idle",
        langTransitionPhase,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
