import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { getAuthCaptchaProvider, getAuthCaptchaSiteKey } from "@/lib/authCaptcha";

type AuthCaptchaLang = "ko" | "en";

function useDocDarkTheme(): "light" | "dark" {
  const [th, setTh] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );
  useEffect(() => {
    const el = document.documentElement;
    const apply = () => setTh(el.classList.contains("dark") ? "dark" : "light");
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return th;
}

interface AuthCaptchaSectionProps {
  resetKey: number;
  onTokenChange: (token: string | null) => void;
  disabled?: boolean;
  lang: AuthCaptchaLang;
}

export function AuthCaptchaSection({
  resetKey,
  onTokenChange,
  disabled = false,
  lang,
}: AuthCaptchaSectionProps) {
  const siteKey = getAuthCaptchaSiteKey();
  const provider = getAuthCaptchaProvider();
  const th = useDocDarkTheme();
  // Dynamic CAPTCHA packages use incompatible prop types; we only mount one at a time.
  const [hcaptcha, setHcaptcha] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [turnstile, setTurnstile] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleSuccess = useCallback(
    (token: string) => {
      onTokenChange(token);
    },
    [onTokenChange],
  );

  const handleClear = useCallback(() => {
    onTokenChange(null);
  }, [onTokenChange]);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    setLoadError(null);
    setHcaptcha(null);
    setTurnstile(null);

    const fail = (e: unknown) => {
      if (!cancelled) {
        setLoadError(e instanceof Error ? e.message : String(e));
      }
    };

    if (provider === "hcaptcha") {
      import("@hcaptcha/react-hcaptcha")
        .then((m) => {
          if (!cancelled) {
            setHcaptcha(() => m.default as unknown as ComponentType<Record<string, unknown>>);
          }
        })
        .catch(fail);
    } else {
      import("@marsidev/react-turnstile")
        .then((m) => {
          if (!cancelled) {
            setTurnstile(() => m.Turnstile as unknown as ComponentType<Record<string, unknown>>);
          }
        })
        .catch(fail);
    }

    return () => {
      cancelled = true;
    };
  }, [siteKey, provider]);

  if (!siteKey) {
    return null;
  }

  let widget: ReactNode;
  if (loadError) {
    widget = (
      <p className="text-sm text-destructive text-center px-2">
        {lang === "ko"
          ? "보안 확인을 불러오지 못했습니다. 새로고침하거나 광고·추적 차단을 잠시 끈 뒤 다시 시도해 주세요."
          : "Could not load the security check. Refresh, or pause ad blockers, and try again."}
      </p>
    );
  } else if (provider === "hcaptcha" && hcaptcha) {
    const H = hcaptcha;
    widget = (
      <H
        key={resetKey}
        sitekey={siteKey}
        theme={th}
        languageOverride={lang === "ko" ? "ko" : "en"}
        size="normal"
        onVerify={handleSuccess}
        onExpire={handleClear}
        onError={handleClear}
      />
    );
  } else if (provider !== "hcaptcha" && turnstile) {
    const T = turnstile;
    widget = (
      <T
        key={resetKey}
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onExpire={handleClear}
        onError={handleClear}
        options={{
          theme: th,
          language: lang === "ko" ? "ko" : "en",
          size: "normal",
        }}
      />
    );
  } else {
    widget = (
      <p className="text-xs text-muted-foreground text-center">
        {lang === "ko" ? "보안 확인 불러오는 중…" : "Loading security check…"}
      </p>
    );
  }

  return (
    <div
      className={`space-y-2 ${disabled ? "pointer-events-none opacity-60" : ""}`}
      aria-disabled={disabled || undefined}
    >
      <div>
        <span className="block mb-1.5 text-sm font-medium">
          {lang === "ko" ? "보안 확인" : "Security check"}
        </span>
        <p className="text-xs text-muted-foreground mb-2">
          {lang === "ko"
            ? "Supabase에서 켜 둔 봇 방지(CAPTCHA)에 맞춰 확인이 필요합니다."
            : "Complete the check to match bot protection enabled in Supabase."}
        </p>
      </div>
      <div className="flex justify-center min-h-[72px] items-center border border-border bg-background py-3 px-2">
        {widget}
      </div>
    </div>
  );
}
