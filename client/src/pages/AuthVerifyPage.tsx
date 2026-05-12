import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { AuthCaptchaSection } from "@/components/auth/AuthCaptchaSection";
import { SlideHumanGate } from "@/components/auth/SlideHumanGate";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  clearChallengeEmail,
  getChallengeEmail,
  sendEmailChallengeCode,
  verifyEmailChallengeCode,
} from "@/lib/authSecondFactor";
import { isAuthCaptchaConfigured } from "@/lib/authCaptcha";
import { getSlideGateConfig } from "@/lib/slideGateEnv";
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
  const [, setLocation] = useLocation();
  const { lang } = useLanguage();
  const [challengeEmail, setChallengeEmailState] = useState(() =>
    typeof window === "undefined" ? "" : resolveChallengeEmail(""),
  );
  const [codeInput, setCodeInput] = useState("");
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [magicSending, setMagicSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  /** 8-character code validated by Edge function; required before 매직링크 플로우 */
  const [emailChallengeVerified, setEmailChallengeVerified] = useState(false);
  /** User clicked 매직링크 보내기 → 슬라이드 설정 시 같은 자리가 슬라이드 UI로 전환; 완료 후 버튼 복귀 */
  const [magicGateOpen, setMagicGateOpen] = useState(false);

  const captchaConfigured = useMemo(() => isAuthCaptchaConfigured(), []);
  const slideGateEnv = useMemo(() => getSlideGateConfig(), []);
  /** 슬라이드 게이트 통과 후 같은 버튼으로 OTP 발송 */
  const [magicSlideDone, setMagicSlideDone] = useState(false);

  const magicSendOnceGuard = useRef(false);

  const bumpCaptchaReset = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);
    magicSendOnceGuard.current = false;
  }, []);

  useEffect(() => {
    setMagicGateOpen(false);
    magicSendOnceGuard.current = false;
    if (!emailChallengeVerified) {
      setMagicSlideDone(false);
    }
  }, [emailChallengeVerified]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const email = resolveChallengeEmail("");
    if (!email) {
      toast.error(lang === "ko" ? "먼저 이메일을 입력해 주세요." : "Please enter your email first.");
      setLocation("/auth/signin");
      return;
    }
    setChallengeEmailState(email);
  }, [lang, setLocation]);

  const canVerifyCode = Boolean(resolveChallengeEmail(challengeEmail));

  const captchaTokenRef = useRef<string | null>(null);
  captchaTokenRef.current = captchaToken;

  const sendMagicLink = useCallback(async () => {
    const email = resolveChallengeEmail(challengeEmail);
    if (!email) return;
    if (magicSending || magicSendOnceGuard.current) return;

    const needsCaptchaToken = captchaConfigured;
    const tok = typeof captchaTokenRef.current === "string" ? captchaTokenRef.current.trim() : "";
    if (needsCaptchaToken && !tok) {
      toast.error(
        lang === "ko"
          ? "먼저 아래 보안 확인(Cloudflare)을 완료해 주세요."
          : "Complete the Cloudflare security check below first.",
      );
      return;
    }

    magicSendOnceGuard.current = true;
    setMagicSending(true);
    try {
      await supabase.auth.signOut({ scope: "local" });

      const redirectTo = new URL("/auth/callback", window.location.origin).toString();
      const otpOptions: {
        emailRedirectTo: string;
        shouldCreateUser: boolean;
        captchaToken?: string;
      } = {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      };
      if (needsCaptchaToken && tok) {
        otpOptions.captchaToken = tok;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: otpOptions,
      });

      if (error) {
        bumpCaptchaReset();
        magicSendOnceGuard.current = false;
        const raw = error.message?.trim() ?? "";
        const normalized = raw.toLowerCase();
        if (normalized.includes("captcha")) {
          toast.error(
            lang === "ko"
              ? "CAPTCHA 검증에 실패했습니다. 배포 환경변수와 Supabase Bot Protection 설정을 확인해 주세요."
              : "CAPTCHA verification failed. Check deployment env vars and Supabase Bot Protection.",
          );
        } else if (normalized.includes("redirect") && normalized.includes("allow")) {
          toast.error(
            lang === "ko"
              ? "리디렉션 URL이 허용되지 않았습니다. Supabase Auth URL에 이 도메인의 /auth/callback을 추가하세요."
              : "Redirect URL is not allowed. Add this domain's /auth/callback in Supabase Auth URL settings.",
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
      setMagicSending(false);
    }
  }, [
    challengeEmail,
    lang,
    captchaConfigured,
    bumpCaptchaReset,
  ]);

  const handleVerifyCodeOnly = async (event: FormEvent) => {
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

    setCodeVerifying(true);
    try {
      const result = await verifyEmailChallengeCode(email, code);
      if (result.error) {
        const key = result.error.message;
        if (key === "code_expired") {
          toast.error(lang === "ko" ? "코드가 만료되었습니다." : "Code expired.");
        } else if (key === "code_mismatch") {
          toast.error(lang === "ko" ? "코드가 일치하지 않습니다." : "Code does not match.");
        } else if (key === "code_not_found") {
          toast.error(lang === "ko" ? "인증 코드가 없습니다." : "No active code found.");
        } else if (key === "supabase_not_configured") {
          toast.error(lang === "ko" ? "앱 설정 오류입니다." : "Configuration error.");
        } else {
          toast.error(lang === "ko" ? "코드 인증 실패." : "Verification failed.");
        }
        return;
      }
      setEmailChallengeVerified(true);
      setMagicGateOpen(false);
      toast.success(
        lang === "ko" ? "코드가 확인되었습니다." : "Code verified.",
      );
    } finally {
      setCodeVerifying(false);
    }
  };

  const openMagicGate = () => {
    if (!emailChallengeVerified) {
      toast.error(lang === "ko" ? "먼저 코드를 확인해 주세요." : "Verify the code first.");
      return;
    }
    magicSendOnceGuard.current = false;
    /** 슬라이드 미설정: 이 버튼 클릭 한 번으로 OTP 발송 */
    if (!slideGateEnv) {
      void sendMagicLink();
      return;
    }
    /** 슬라이드 통과 후: 같은 버튼으로 즉시 발송 */
    if (magicSlideDone) {
      void sendMagicLink();
      return;
    }
    setMagicGateOpen(true);
  };

  const resendCode = async () => {
    const email = resolveChallengeEmail(challengeEmail);
    if (!email) return;
    setResending(true);
    const result = await sendEmailChallengeCode(email);
    setResending(false);
    if (result.error) {
      toast.error(
        lang === "ko" ? "코드 재전송에 실패했습니다." : "Failed to resend code.",
      );
      return;
    }
    setEmailChallengeVerified(false);
    setMagicGateOpen(false);
    bumpCaptchaReset();
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
              ? "코드를 확인하고 Cloudflare 보안 확인까지 마친 뒤 매직링크 보내기를 누르면 메일로 링크가 갑니다. (슬라이드가 켜져 있으면 한 번 통과한 뒤 같은 버튼으로 보냅니다.)"
              : "Verify your code and complete Cloudflare, then tap Send magic link. If slide verification is enabled, pass the slide once—then tap the same button again to send."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="border border-border bg-background px-3 py-2 text-sm">
            <span className="text-muted-foreground mr-2">{lang === "ko" ? "인증 대상" : "Verifying"}:</span>
            <span className="font-mono">{resolveChallengeEmail(challengeEmail) || "-"}</span>
          </div>

          <form className="space-y-3" onSubmit={handleVerifyCodeOnly}>
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
                disabled={codeVerifying || emailChallengeVerified}
              />
            </label>

            <button
              type="submit"
              disabled={codeVerifying || !canVerifyCode || emailChallengeVerified}
              className="w-full h-11 keyp-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {codeVerifying
                ? lang === "ko"
                  ? "코드 확인 중..."
                  : "Verifying code..."
                : emailChallengeVerified
                  ? lang === "ko"
                    ? "코드 확인됨"
                    : "Code verified"
                  : lang === "ko"
                    ? "코드 확인"
                    : "Verify code"}
            </button>
          </form>

          {captchaConfigured ? (
            <div className="border-t border-border pt-4 space-y-2">
              <AuthCaptchaSection
                resetKey={captchaResetKey}
                onTokenChange={setCaptchaToken}
                disabled={magicSending}
                lang={lang === "ko" ? "ko" : "en"}
              />
            </div>
          ) : null}

          {emailChallengeVerified ? (
            <div className="space-y-3 border-t border-border pt-4">
              {!magicGateOpen && !magicSending ? (
                <button
                  type="button"
                  disabled={
                    magicSending ||
                    (captchaConfigured &&
                      !(typeof captchaToken === "string" && captchaToken.trim()))
                  }
                  title={
                    captchaConfigured &&
                    !(typeof captchaToken === "string" && captchaToken.trim())
                      ? lang === "ko"
                        ? "먼저 위 보안 확인을 완료하세요."
                        : "Complete the security check above."
                      : undefined
                  }
                  className="w-full h-11 keyp-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={openMagicGate}
                >
                  {lang === "ko" ? "매직링크 보내기" : "Send magic link"}
                </button>
              ) : null}

              {magicSending ? (
                <p className="text-center font-mono text-xs text-muted-foreground">
                  {lang === "ko" ? "매직링크 발송 중…" : "Sending magic link…"}
                </p>
              ) : null}

              {magicGateOpen && slideGateEnv ? (
                <div className="relative isolate min-h-[120px] w-full overflow-visible">
                  <div className="relative z-30 w-full">
                    <SlideHumanGate
                      config={slideGateEnv}
                      lang={lang === "ko" ? "ko" : "en"}
                      disabled={magicSending}
                      onHumanVerified={() => {
                        setMagicSlideDone(true);
                        setMagicGateOpen(false);
                        toast(
                          lang === "ko"
                            ? "슬라이드 확인 완료. 매직링크 보내기를 다시 눌러 메일을 보냅니다."
                            : "Slide verified. Tap Send magic link again to email the link.",
                        );
                      }}
                      onBotSuspected={() => {
                        toast.error(
                          lang === "ko"
                            ? "패턴 감지: 일정 속도입니다. 속도 변화를 포함해 다시 시도해 주세요."
                            : "Too steady. Try again with natural, uneven motion.",
                        );
                      }}
                      onGestureIncomplete={() =>
                        toast(
                          lang === "ko"
                            ? "끝까지 천천히 밀었다가 놓아 주세요."
                            : "Slide further, then release.",
                        )
                      }
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
                    {lang === "ko"
                      ? "통과 후 매직링크 보내기 버튼이 다시 나타납니다. Cloudflare 확인은 위와 같습니다."
                      : "After you pass, the Send magic link button returns. Cloudflare stays above."}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={resendCode}
            disabled={
              resending || codeVerifying || magicSending || !canVerifyCode
            }
            className="w-full h-10 border border-border text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending
              ? lang === "ko"
                ? "재전송 중..."
                : "Resending..."
              : lang === "ko"
                ? "코드 다시 보내기"
                : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}
