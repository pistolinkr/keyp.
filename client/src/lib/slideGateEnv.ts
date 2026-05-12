/**
 * Slide gate before CAPTCHA — all knobs from Vite env (client bundle).
 * If VITE_SLIDE_GATE_ENABLED is not fully configured, Turnstile must not appear.
 */

export type SlideGateConfig = {
  /** Position along track (0–1). Bot heuristic: steady motion past this fails. Default intent: 5/7 ≈ 0.7143 */
  botPathRatio: number;
  /** Coefficient of variation of step speeds ≤ this ⇒ "steady" (machine-like band). Above ⇒ human-like. */
  botCvMax: number;
  /** Minimum paired speed samples needed to evaluate CV */
  minSpeedSamples: number;
};

function parseRatio(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n <= 0 || n > 1) return null;
  return n;
}

function parsePositive(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseIntStrict(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 3) return null;
  return n;
}

/**
 * Strict: unless every required env is set alongside VITE_SLIDE_GATE_ENABLED=true, returns null
 * → caller must hide Cloudflare/Turnstile entirely.
 */
export function getSlideGateConfig(): SlideGateConfig | null {
  const enabled = (import.meta.env.VITE_SLIDE_GATE_ENABLED as string | undefined)?.trim().toLowerCase();
  if (enabled !== "true" && enabled !== "1" && enabled !== "yes") {
    return null;
  }

  const botPathRatio = parseRatio(import.meta.env.VITE_SLIDE_BOT_PATH_RATIO as string | undefined);
  const botCvMax = parsePositive(import.meta.env.VITE_SLIDE_BOT_CV_MAX as string | undefined);
  const minSpeedSamples = parseIntStrict(import.meta.env.VITE_SLIDE_MIN_SPEED_SAMPLES as string | undefined);

  if (botPathRatio === null || botCvMax === null || minSpeedSamples === null) {
    return null;
  }

  return {
    botPathRatio,
    botCvMax,
    minSpeedSamples,
  };
}
