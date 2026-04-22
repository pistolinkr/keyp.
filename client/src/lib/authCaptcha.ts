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

export function isAuthCaptchaConfigured(): boolean {
  return getAuthCaptchaSiteKey() !== null;
}
