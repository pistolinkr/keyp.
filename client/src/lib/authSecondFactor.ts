import { supabase } from "@/lib/supabase";

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

async function invokeSecondFactor(
  action: "send_code" | "verify_code",
  email: string,
  code?: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
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
        action,
        email: normalizedEmail,
        ...(code ? { code: code.trim().toUpperCase() } : {}),
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

export async function sendEmailChallengeCode(email: string) {
  return invokeSecondFactor("send_code", email);
}

export async function verifyEmailChallengeCode(email: string, code: string) {
  return invokeSecondFactor("verify_code", email, code);
}

export function setChallengeEmail(email: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHALLENGE_EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    // Ignore storage failures.
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
    // Ignore storage failures.
  }
}
