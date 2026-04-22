import { useEffect, useMemo, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { clearChallengeEmail } from "@/lib/authSecondFactor";

export default function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const { lang } = useLanguage();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const payload = useMemo(() => {
    if (typeof window === "undefined") return null;
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const tokenHash = searchParams.get("token_hash") ?? hashParams.get("token_hash");
    const typeFromUrl = searchParams.get("type") ?? hashParams.get("type");
    const hasSessionFragment = Boolean(hashParams.get("access_token") && hashParams.get("refresh_token"));

    const validTypes: EmailOtpType[] = [
      "signup",
      "invite",
      "magiclink",
      "recovery",
      "email",
      "email_change",
    ];
    if (tokenHash && typeFromUrl && validTypes.includes(typeFromUrl as EmailOtpType)) {
      return { mode: "otp" as const, tokenHash, type: typeFromUrl as EmailOtpType };
    }
    if (hasSessionFragment) {
      return { mode: "session_fragment" as const };
    }
    return null;
  }, []);

  useEffect(() => {
    // If session is already established (e.g. link already exchanged), enter platform immediately.
    let quickCancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (quickCancelled) return;
      if (data.session?.user?.id) {
        clearChallengeEmail();
        setLocation("/feed");
      }
    })();
    return () => {
      quickCancelled = true;
    };
  }, [setLocation]);

  useEffect(() => {
    if (!payload) {
      toast.error(
        lang === "ko"
          ? "유효하지 않은 인증 링크입니다."
          : "Invalid authentication link.",
      );
      setLocation("/auth/signin");
      return;
    }

    let cancelled = false;
    (async () => {
      if (payload.mode === "otp") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: payload.tokenHash,
          type: payload.type,
        });
        if (cancelled) return;
        if (error) {
          setErrorMessage(
            lang === "ko"
              ? "매직 링크 인증에 실패했습니다. 링크가 만료되었거나 이미 사용되었을 수 있습니다."
              : "Magic-link verification failed. The link may be expired or already used.",
          );
          return;
        }
      }

      // Some providers/templates return token fragments in URL hash.
      // Wait briefly for supabase-js to hydrate session from URL.
      let user: { id: string } | null = null;
      for (let i = 0; i < 10; i += 1) {
        const { data } = await supabase.auth.getSession();
        user = data.session?.user ? { id: data.session.user.id } : null;
        if (user) break;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      if (cancelled) return;

      if (!user?.id) {
        setErrorMessage(
          lang === "ko"
            ? "로그인 세션을 확인하지 못했습니다. 다시 시도해 주세요."
            : "Could not establish session. Please try again.",
        );
        return;
      }

      clearChallengeEmail();
      setLocation("/feed");
    })();

    return () => {
      cancelled = true;
    };
  }, [lang, payload, setLocation]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md border border-border p-7 bg-card">
        <h1 className="font-bold text-2xl mb-2">{lang === "ko" ? "링크 인증 중" : "Verifying link"}</h1>
        {errorMessage ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setLocation("/auth/signin")}
              className="w-full h-11 border border-border text-sm hover:bg-accent transition-colors"
            >
              {lang === "ko" ? "로그인 페이지로 이동" : "Back to sign in"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {lang === "ko"
              ? "매직 링크를 확인했습니다. 피드로 이동합니다."
              : "Magic link verified. Redirecting to feed."}
          </p>
        )}
      </div>
    </div>
  );
}

