import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getConfiguredDevBypassEmail, useAuth } from "@/contexts/AuthContext";
import { sendEmailChallengeCode, setChallengeEmail } from "@/lib/authSecondFactor";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { lang } = useLanguage();
  const { user, loading, signInLocalDev, signOut } = useAuth();

  const getOtpErrorMessage = (raw: string | undefined) => {
    const normalized = (raw ?? "").toLowerCase();
    if (normalized.includes("rate limit")) {
      return {
        ko: "로그인 메일 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
        en: "Too many magic-link requests. Please try again later.",
      };
    }
    if (normalized.includes("smtp") || normalized.includes("send") || normalized.includes("email")) {
      return {
        ko: "로그인 메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        en: "Failed to send sign-in email. Please try again later.",
      };
    }
    return {
      ko: "로그인 메일 전송 실패",
      en: "Failed to send sign-in email",
    };
  };

  const handleCodeSignIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    const normalizedEmail = email.trim().toLowerCase();

    const devBypassEmail = getConfiguredDevBypassEmail();
    if (devBypassEmail && normalizedEmail === devBypassEmail) {
      signInLocalDev(normalizedEmail);
      toast.success(lang === "ko" ? "로컬 개발 계정으로 로그인했습니다." : "Signed in with local dev account.");
      setLocation("/feed");
      return;
    }

    setSubmitting(true);
    const { error } = await sendEmailChallengeCode(normalizedEmail);
    setSubmitting(false);

    if (error) {
      const msg = getOtpErrorMessage(error.message);
      toast.error(lang === "ko" ? msg.ko : msg.en);
      return;
    }

    setChallengeEmail(normalizedEmail);
    toast.success(
      lang === "ko"
        ? "8자리 인증 코드를 메일로 보냈습니다."
        : "An 8-character code was sent to your email.",
    );
    setLocation(`/auth/verify?email=${encodeURIComponent(normalizedEmail)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md border border-border p-7 bg-card">
        <div className="mb-6">
          <img src="/logo.png" alt="Keyp. logo" className="h-8 w-auto object-contain mb-4" />
          <h1 className="font-bold text-2xl mb-1">{lang === "ko" ? "로그인" : "Sign in"}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === "ko"
              ? "사용자 기반 플랫폼 사용을 위해 이메일 로그인이 필요합니다."
              : "Email sign-in is required to use the user-based platform."}
          </p>
        </div>

        {!loading && user && !user.isLocalDev ? (
          <div className="mb-6 space-y-3 rounded border border-border bg-muted/30 p-4 text-sm">
            <p className="text-foreground">
              {lang === "ko"
                ? "이미 로그인된 상태입니다. 다른 이메일로 가입하거나 로그인하려면 먼저 로그아웃해 주세요."
                : "You are already signed in. Sign out first to register or sign in with another email."}
            </p>
            <p className="font-mono text-xs text-muted-foreground break-all">
              {user.email ?? user.id}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="flex-1 keyp-btn-primary h-10 text-sm"
                onClick={() => setLocation("/feed")}
              >
                {lang === "ko" ? "피드로 가기" : "Go to feed"}
              </button>
              <button
                type="button"
                className="flex-1 h-10 border border-border text-sm hover:bg-accent transition-colors"
                onClick={() => void signOut().then(() => setLocation("/auth/signin"))}
              >
                {lang === "ko" ? "로그아웃 후 다른 계정" : "Sign out & use another account"}
              </button>
            </div>
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={handleCodeSignIn}
        >
          <label className="block">
            <span className="block mb-1.5 text-sm font-medium">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full h-11 px-3 border border-border bg-background text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
              placeholder="you@example.com"
              disabled={Boolean(!loading && user && !user.isLocalDev)}
            />
          </label>

          <button
            type="submit"
            disabled={submitting || Boolean(!loading && user && !user.isLocalDev)}
            className="w-full h-11 keyp-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? lang === "ko"
                ? "전송 중..."
                : "Sending..."
              : lang === "ko"
                ? "8자리 코드 받기"
                : "Send 8-character code"}
          </button>
        </form>
      </div>
    </div>
  );
}
