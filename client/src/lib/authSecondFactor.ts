const CHALLENGE_EMAIL_KEY = "keyp.auth.challenge.email";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

type SecondFactorError = {
  message: string;
  status?: number;
  context?: { status?: number };
};

type SecondFactorResult = {
  data: Record<string, unknown> | null;
  error: SecondFactorError | null;
};

function makeError(message: string, status?: number): SecondFactorResult {
  return {
    data: null,
    error: {
      message,
      status,
      context: status ? { status } : undefined,
    },
  };
}

type EdgeSecondFactorPayload = {
  action: string;
  email: string;
  code?: string;
  locale?: "ko" | "en";
  challengeId?: string;
  selectedColorKey?: string;
};

async function postSecondFactor(payload: EdgeSecondFactorPayload): Promise<SecondFactorResult> {
  const normalizedEmail = payload.email.trim().toLowerCase();
  if (!normalizedEmail) return makeError("invalid_email", 400);
  if (!supabaseUrl || !supabaseAnonKey) return makeError("supabase_not_configured", 500);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/auth-second-factor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        ...payload,
        email: normalizedEmail,
      }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err =
        (json as { error?: string; message?: string })?.error ||
        (json as { error?: string; message?: string })?.message ||
        `http_${response.status}`;
      return makeError(err, response.status);
    }
    return { data: json as Record<string, unknown>, error: null };
  } catch {
    return makeError("network_error", 0);
  }
}

export async function sendEmailChallengeCode(email: string, locale?: "ko" | "en") {
  return postSecondFactor({
    action: "send_code",
    email,
    ...(locale === "ko" || locale === "en" ? { locale } : {}),
  });
}

export async function verifyEmailChallengeCode(email: string, code: string) {
  return postSecondFactor({ action: "verify_code", email, code });
}

export async function beginSqQuarterChallenge(email: string) {
  return postSecondFactor({ action: "sq_begin", email });
}

export async function verifySqQuarterChallenge(input: {
  email: string;
  challengeId: string;
  selectedColorKey: string;
  code: string;
}) {
  const { email, challengeId, selectedColorKey, code } = input;
  return postSecondFactor({
    action: "sq_verify",
    email,
    challengeId,
    selectedColorKey,
    code,
  });
}

export function setChallengeEmail(email: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHALLENGE_EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

export function getChallengeEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(CHALLENGE_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearChallengeEmail() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CHALLENGE_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}
