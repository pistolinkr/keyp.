import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type Action = "send_code" | "verify_code";

type RequestBody = {
  action?: Action;
  email?: string;
  code?: string;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CODE_EXPIRY_MINUTES = 10;
const CODE_LENGTH = 8;
const MAX_VERIFY_ATTEMPTS = 5;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function responseJson(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function createRandomCode(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function hashCode(code: string): Promise<string> {
  const encoded = new TextEncoder().encode(code.trim().toUpperCase());
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

async function sendCodeEmail(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("TWO_FACTOR_FROM_EMAIL");
  if (!resendApiKey || !fromEmail) {
    return { ok: false, error: "missing_email_provider_env" };
  }

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin-bottom: 8px;">Keyp. 2FA Verification</h2>
      <p style="margin: 0 0 10px;">Enter this 8-character verification code in the app.</p>
      <div style="font-size: 26px; letter-spacing: 0.22em; font-weight: 700; margin: 12px 0;">${code}</div>
      <p style="margin: 10px 0 0; color: #666;">This code expires in ${CODE_EXPIRY_MINUTES} minutes.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: "Your Keyp. verification code",
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("resend_send_failed", res.status, text.slice(0, 500));
    return { ok: false, error: "email_send_failed" };
  }
  return { ok: true };
}

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
    if (req.method !== "POST") return responseJson({ error: "method_not_allowed" }, 405);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRoleKey) {
      console.error("auth-second-factor: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return responseJson({ error: "missing_function_env" }, 500);
    }

    const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return responseJson({ error: "invalid_json" }, 400);
    }

    const rawEmail = body.email?.trim() ?? "";
    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
      return responseJson({ error: "invalid_email" }, 400);
    }
    const email = normalizeEmail(rawEmail);

    if (body.action === "send_code") {
      const code = createRandomCode(CODE_LENGTH);
      const codeHash = await hashCode(code);

      const invalidate = await admin
        .from("auth_email_challenges")
        .update({ consumed_at: new Date().toISOString() })
        .eq("email", email)
        .is("consumed_at", null);
      if (invalidate.error) {
        return responseJson({ error: invalidate.error.message }, 400);
      }

      const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60_000).toISOString();
      const { error: insertError } = await admin.from("auth_email_challenges").insert({
        email,
        code_hash: codeHash,
        expires_at: expiresAt,
      });
      if (insertError) {
        return responseJson({ error: insertError.message }, 400);
      }

      const sent = await sendCodeEmail(email, code);
      if (!sent.ok) {
        const err = sent.error ?? "email_send_failed";
        const status = err === "missing_email_provider_env" ? 503 : 502;
        return responseJson({ error: err }, status);
      }

      return responseJson({ ok: true, expiresAt });
    }

    if (body.action === "verify_code") {
      const rawCode = body.code?.trim().toUpperCase();
      if (!rawCode || rawCode.length !== CODE_LENGTH) {
        return responseJson({ error: "invalid_code_format" }, 400);
      }

      const { data: latestCode, error: selectError } = await admin
        .from("auth_email_challenges")
        .select("id, code_hash, expires_at, consumed_at, attempt_count")
        .eq("email", email)
        .is("consumed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (selectError) {
        return responseJson({ error: selectError.message }, 400);
      }
      if (!latestCode) {
        return responseJson({ error: "code_not_found" }, 404);
      }

      const now = Date.now();
      const expiresAtMs = Date.parse(latestCode.expires_at);
      const nowIso = new Date(now).toISOString();
      if (!Number.isFinite(expiresAtMs)) {
        await admin.from("auth_email_challenges").update({ consumed_at: nowIso }).eq("id", latestCode.id);
        return responseJson({ error: "code_expired" }, 400);
      }
      if (expiresAtMs <= now) {
        await admin.from("auth_email_challenges").update({ consumed_at: nowIso }).eq("id", latestCode.id);
        return responseJson({ error: "code_expired" }, 400);
      }

      if ((latestCode.attempt_count ?? 0) >= MAX_VERIFY_ATTEMPTS) {
        await admin.from("auth_email_challenges").update({ consumed_at: nowIso }).eq("id", latestCode.id);
        return responseJson({ error: "code_locked" }, 429);
      }

      const incomingHash = await hashCode(rawCode);
      if (incomingHash !== latestCode.code_hash) {
        await admin
          .from("auth_email_challenges")
          .update({ attempt_count: (latestCode.attempt_count ?? 0) + 1 })
          .eq("id", latestCode.id);
        return responseJson({ error: "code_mismatch" }, 400);
      }

      const { error: consumeError } = await admin
        .from("auth_email_challenges")
        .update({ consumed_at: nowIso, magic_link_sent_at: nowIso })
        .eq("id", latestCode.id);
      if (consumeError) {
        return responseJson({ error: consumeError.message }, 400);
      }

      return responseJson({ ok: true, codeVerified: true });
    }

    return responseJson({ error: "unsupported_action" }, 400);
  } catch (e) {
    console.error("auth-second-factor_unhandled", e instanceof Error ? e.message : e);
    return responseJson({ error: "internal_error" }, 500);
  }
});
