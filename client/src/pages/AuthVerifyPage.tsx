import { FormEvent, useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { AuthCaptchaSection } from "@/components/auth/AuthCaptchaSection";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  clearChallengeEmail,
  getChallengeEmail,
  sendEmailChallengeCode,
  verifyEmailChallengeCode,
} from "@/lib/authSecondFactor";
import { isAuthCaptchaConfigured } from "@/lib/authCaptcha";
import { supabase } from "@/lib/supabase";

function resolveChallengeEmail(fallbackState: string): string {
  if (typeof window === "undefined") return fallbackState.trim().toLowerCase();
  const fromUrl =
    new URLSearchParams(window.location.search).get("email")?.trim().toLowerCase() ?? "";
  const stored = getChallengeEmail().trim().toLowerCase();
  const fromState = fallbackState.trim().toLowerCase();
  return fromUrl || stored || fromState;
}

export default function AuthVerifyPage() {
  const [location, setLocation] = useLocation();
  const { lang } = useLanguage();
  const [challengeEmail, setChallengeEmailState] = useState(() =>
    typeof window === "undefined" ? "" : resolveChallengeEmail(""),
  );
  const [codeInput, setCodeInput] = useState("");
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const captchaNeeded = isAuthCaptchaConfigured();

  const bumpCaptchaReset = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const email = resolveChallengeEmail("");
    if (!email) {
      toast.error(lang === "ko" ? "먼저 이메일을 입력해 주세요." : "Please enter your email first.");
      setLocation("/auth/signin");
      return;
    }
    setChallengeEmailState(email);
  }, [lang, location, setLocation]);

  const canVerifyCode = Boolean(resolveChallengeEmail(challengeEmail));

  const verifySecondFactorCode = async (event: FormEvent) => {
    event.preventDefault();
    const email = resolveChallengeEmail(challengeEmail);
    if (!email) {
      toast.error(lang === "ko" ? "먼저 이메일을 입력해 주세요." : "Please enter your email first.");
      setLocation("/auth/signin");
      return;
    }
    const code = codeInput.trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      toast.error(
        lang === "ko"
          ? "코드는 영문 대문자/숫자 8자리여야 합니다."
          : "Code must be exactly 8 letters/numbers.",
      );
      return;
    }

    if (captchaNeeded && !captchaToken?.trim()) {
      toast.error(
        lang === "ko"
          ? "보안 확인(CAPTCHA)을 완료해 주세요."
          : "Please complete the security check (CAPTCHA).",
      );
      return;
    }

    setCodeSubmitting(true);
    try {
      const result = await verifyEmailChallengeCode(email, code);
      if (result.error) {
        const key = result.error.message;
        if (key === "code_expired") {
          toast.error(lang === "ko" ? "코드가 만료되었습니다. 새 코드를 받아주세요." : "Code expired. Please request a new one.");
        } else if (key === "code_mismatch") {
          toast.error(lang === "ko" ? "코드가 일치하지 않습니다. 다시 확인해 주세요." : "Code does not match. Please check and try again.");
        } else if (key === "code_not_found") {
          toast.error(lang === "ko" ? "인증 코드가 없습니다. 코드를 다시 받아주세요." : "No active code found. Please request a new code.");
        } else if (key === "supabase_not_configured") {
          toast.error(lang === "ko" ? "앱 설정 오류입니다. 관리자에게 문의해 주세요." : "App configuration error. Please contact support.");
        } else {
          toast.error(lang === "ko" ? "코드 인증에 실패했습니다. 다시 시도해 주세요." : "Failed to verify code. Please try again.");
        }
        return;
      }

      // Clear any existing session so magic-link OTP is always for this email (new signup or account switch).
      await supabase.auth.signOut({ scope: "local" });

      const redirectTo = `${window.location.origin}/auth/callback?email=${encodeURIComponent(email)}`;
      const otpOptions: {
        emailRedirectTo: string;
        shouldCreateUser: boolean;
        captchaToken?: string;
      } = {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      };
      if (captchaNeeded && captchaToken?.trim()) {
        otpOptions.captchaToken = captchaToken.trim();
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: otpOptions,
      });
      if (error) {
        bumpCaptchaReset();
        const raw = error.message?.trim() ?? "";
        const normalized = raw.toLowerCase();
        if (normalized.includes("captcha")) {
          toast.error(
            lang === "ko"
              ? "CAPTCHA 검증에 실패했습니다. 배포 환경변수(VITE_CAPTCHA_PROVIDER, VITE_CAPTCHA_SITE_KEY)와 Supabase Bot Protection 설정을 확인해 주세요."
              : "CAPTCHA verification failed. Check deployment env vars (VITE_CAPTCHA_PROVIDER, VITE_CAPTCHA_SITE_KEY) and Supabase Bot Protection settings.",
          );
        } else if (normalized.includes("redirect") && normalized.includes("allow")) {
          toast.error(
            lang === "ko"
              ? "리디렉션 URL이 허용되지 않았습니다. Supabase Auth URL 설정에 현재 도메인의 /auth/callback URL을 추가해 주세요."
              : "Redirect URL is not allowed. Add this domain's /auth/callback URL in Supabase Auth URL settings.",
          );
        } else {
          toast.error(
            lang === "ko"
              ? `매직 링크 발송 실패: ${raw || "서버 응답 오류"}`
              : `Failed to send magic link: ${raw || "Server response error"}`,
          );
        }
        return;
      }

      clearChallengeEmail();
      toast.success(
        lang === "ko"
          ? "인증 완료! 피드 입장 매직 링크를 메일로 보냈습니다."
          : "Verified! Feed entry magic link was sent by email.",
      );
    } finally {
      setCodeSubmitting(false);
    }
  };

  const resendCode = async () => {
    const email = resolveChallengeEmail(challengeEmail);
    if (!email) return;
    setResending(true);
    const result = await sendEmailChallengeCode(email);
    setResending(false);
    if (result.error) {
      toast.error(
        lang === "ko"
          ? "코드 재전송에 실패했습니다. 잠시 후 다시 시도해 주세요."
          : "Failed to resend code. Please try again later.",
      );
      return;
    }
    toast.success(
      lang === "ko"
        ? "새 8자리 인증 코드를 보냈습니다."
        : "A new 8-character code was sent.",
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md border border-border p-7 bg-card">
        <div className="mb-6">
          <img src="/logo.png" alt="Keyp. logo" className="h-8 w-auto object-contain mb-4" />
          <h1 className="font-bold text-2xl mb-1">{lang === "ko" ? "코드 인증" : "Code verification"}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === "ko"
              ? "메일로 받은 8자리 코드를 인증하면 피드 입장 매직 링크가 발송됩니다."
              : "Verify the 8-character code and we'll send your feed entry magic link."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="border border-border bg-background px-3 py-2 text-sm">
            <span className="text-muted-foreground mr-2">{lang === "ko" ? "인증 대상" : "Verifying"}:</span>
            <span className="font-mono">{resolveChallengeEmail(challengeEmail) || "-"}</span>
          </div>

          <form className="space-y-3" onSubmit={verifySecondFactorCode}>
            <label className="block">
              <span className="block mb-1.5 text-sm font-medium">
                {lang === "ko" ? "8자리 인증 코드" : "8-character code"}
              </span>
              <input
                type="text"
                required
                value={codeInput}
                onChange={(event) =>
                  setCodeInput(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
                }
                className="w-full h-11 px-3 border border-border bg-background text-foreground focus:outline-none focus:border-primary tracking-[0.18em] font-mono"
                placeholder="AB12CD34"
                maxLength={8}
                disabled={codeSubmitting}
              />
            </label>

            {captchaNeeded ? (
              <AuthCaptchaSection
                resetKey={captchaResetKey}
                onTokenChange={setCaptchaToken}
                disabled={codeSubmitting}
                lang={lang === "ko" ? "ko" : "en"}
              />
            ) : null}

            <button
              type="submit"
              disabled={
                codeSubmitting || !canVerifyCode || (captchaNeeded && !captchaToken?.trim())
              }
              className="w-full h-11 keyp-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {codeSubmitting
                ? (lang === "ko" ? "확인 중..." : "Verifying...")
                : (lang === "ko" ? "코드 인증하고 매직링크 받기" : "Verify code and send magic link")}
            </button>

            <button
              type="button"
              onClick={resendCode}
              disabled={resending || codeSubmitting || !canVerifyCode}
              className="w-full h-10 border border-border text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending
                ? (lang === "ko" ? "재전송 중..." : "Resending...")
                : (lang === "ko" ? "코드 다시 보내기" : "Resend code")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

