export type AuthCaptchaProvider = "turnstile" | "hcaptcha";

export function getAuthCaptchaSiteKey(): string | null {
  const raw = import.meta.env.VITE_CAPTCHA_SITE_KEY as string | undefined;
  const key = raw?.trim();
  return key || null;
}

export function getAuthCaptchaProvider(): AuthCaptchaProvider {
  const raw = (import.meta.env.VITE_CAPTCHA_PROVIDER as string | undefined)?.trim().toLowerCase();
  return raw === "hcaptcha" ? "hcaptcha" : "turnstile";
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isLocalRuntime(): boolean {
  if (typeof window === "undefined") return false;
  return isLocalHostname(window.location.hostname);
}

function shouldEnableCaptchaOnLocalhost(): boolean {
  const raw = (import.meta.env.VITE_CAPTCHA_ENABLE_LOCAL as string | undefined)?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function isAuthCaptchaConfigured(): boolean {
  const hasSiteKey = getAuthCaptchaSiteKey() !== null;
  if (!hasSiteKey) return false;

  if (isLocalRuntime() && !shouldEnableCaptchaOnLocalhost()) {
    return false;
  }

  return true;
}
