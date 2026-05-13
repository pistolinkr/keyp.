import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeadersForRequest } from "../_shared/cors.ts";

type Action = "send_code" | "verify_code" | "sq_begin" | "sq_verify";

type RequestBody = {
  action?: Action;
  email?: string;
  code?: string;
  challengeId?: string;
  selectedColorKey?: string;
  /** Localization for transactional email copy (mailbox step); default ko */
  locale?: "ko" | "en";
};

const CODE_EXPIRY_MINUTES = 10;
const SQ_EXPIRY_MINUTES = 10;
const CODE_LENGTH = 8;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SQ_VERIFY_ATTEMPTS = 5;
const SQ_COLOR_KEYS = ["sapphire", "emerald", "ruby", "amber", "violet"] as const;

function shuffleSqTiles<T>(arr: T[]): T[] {
  const a = [...arr];
  const u = new Uint32Array(1);
  for (let i = a.length - 1; i > 0; i--) {
    crypto.getRandomValues(u);
    const j = u[0]! % (i + 1);
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

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

function buildMailboxChallengeEmailHtml(locale: "ko" | "en", code: string): string {
  const accentBar = "#e9a91f";
  const textMain = "#1A1A1A";
  const textMuted = "#666666";
  const disclaimer = locale === "ko"
    ? "해당 플랫폼에서 코드 요청을 한 것이 아니라면, 이 메일을 무시하세요."
    : "If you did not request this code, ignore this email.";
  const footer = locale === "ko"
    ? "Secured Quarter (SQ) 2FA 안내 템플릿 · Keyp."
    : "Secured Quarter (SQ) 2FA notice · Keyp.";
  const title = locale === "ko"
    ? "SQ 이중인증 (Secured Quarter 2FA)"
    : "Secured Quarter 2FA (SQ)";
  const bodyParagraph = locale === "ko"
    ? `먼저 아래 메일 확인용 8자리 코드를 사용자 인증 페이지에 입력합니다. 다음 단계(SQ 2차)에서는 <strong style="color:${textMain}">안내 표시되는 색</strong>과 일치하는 <strong style="color:${textMain}">버튼을 이 페이지 안에서 탭</strong>해 새 창 없이 해당 버튼에 나타나는 문자·숫자 혼합 8자 코드를 확인한 뒤 제출하면 로그인을 마칩니다.`
    : `Enter the mailed 8-character code on the verification page first. Next, complete <strong>SQ (Secured Quarter)</strong>: staying on this page without opening a new tab, tap the button whose <strong style="color:${textMain};">color matches what the verification page asks for</strong>, read the 8 alphanumeric characters printed on it, paste them below, submit, then continue with Cloudflare and the magic link.`;
  const codeLabel =
    locale === "ko" ? "메일로 전송된 1차 확인 코드" : "Step 1 code (from this email)";
  const expires =
    locale === "ko"
      ? `이 코드의 유효 시간은 약 ${CODE_EXPIRY_MINUTES}분입니다.`
      : `This code expires in about ${CODE_EXPIRY_MINUTES} minutes.`;

  const strip = `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;margin:0 auto;font-family:Inter,system-ui,-apple-system,sans-serif;background:#fafafa;">
    <tr><td style="padding:40px;">
      <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-sizing:border-box;border:1px solid #eeeeee;">
        <div style="height:4px;background:${accentBar};"></div>
        <div style="padding:48px 48px 32px;color:${textMain};">
          <h1 style="margin:0 0 12px;font-size:32px;font-weight:700;line-height:1.2;text-align:center;">${title}</h1>
          <p style="margin:0 0 28px;color:${textMuted};font-size:16px;line-height:1.5;text-align:center;">${bodyParagraph}</p>
          <p style="margin:0 0 8px;color:${textMuted};font-size:14px;line-height:1.4;text-align:center;">${codeLabel}</p>
          <div style="margin:14px auto 10px;display:inline-block;width:100%;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="background:#D6EEFF;border:1px solid #AACCE8;border-radius:12px;margin:0 auto;">
              <tr><td style="padding:20px 32px;font-family:ui-monospace,monospace;font-size:28px;letter-spacing:0.22em;font-weight:600;color:${textMain};">${code}</td></tr>
            </table>
          </div>
          <p style="margin:16px 0 0;color:${textMuted};font-size:13px;line-height:1.5;text-align:center;">${expires}</p>
          <p style="margin:28px 0 0;color:#999;font-size:14px;line-height:1.5;text-align:center;">${disclaimer}</p>
          <p style="margin:28px 0 0;color:#BBB;font-size:13px;line-height:1.4;text-align:center;">${footer}</p>
        </div>
      </div>
      <table role="presentation" width="100%" style="margin-top:22px;"><tr><td align="center" style="color:#BBB;font-size:12px;">
      <table role="presentation" cellspacing="12" cellpadding="14" align="center" style="opacity:0.55;margin-top:12px;"><tr>
        <td style="border-radius:12px;background:#FFD6E7;border:1px solid #FFADD0;">&nbsp;&nbsp;</td>
        <td style="border-radius:12px;background:#D6EEFF;border:1px solid #AACCE8;">&nbsp;&nbsp;</td>
      </tr><tr>
        <td style="border-radius:12px;background:#D6F5E3;border:1px solid #A8E6C3;">&nbsp;&nbsp;</td>
        <td style="border-radius:12px;background:#E8D6FF;border:1px solid #C9A8E6;">&nbsp;&nbsp;</td>
      </tr><tr><td colspan="2" align="center" style="padding-top:10px;"><span style="display:inline-block;width:140px;height:52px;border-radius:12px;background:#FFF4D6;border:1px solid #EBD199;line-height:0;">&#8203;</span></td></tr></table>
      <p style="margin:12px 0 0;color:#999;font-size:12px;">SQ · illustrative color tiles · real codes shown only after tap on verify page.</p>
      </td></tr></table>
    </td></tr>
  </table>`;
  return strip;
}

async function sendCodeEmail(
  email: string,
  code: string,
  locale: "ko" | "en",
): Promise<{ ok: boolean; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("TWO_FACTOR_FROM_EMAIL");
  if (!resendApiKey || !fromEmail) {
    return { ok: false, error: "missing_email_provider_env" };
  }

  const html = buildMailboxChallengeEmailHtml(locale, code);

  const subject =
    locale === "ko"
      ? "[Keyp.] SQ 이중인증 — 메일 확인 코드"
      : "[Keyp.] Secured Quarter — mailbox verification code";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject,
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
  const cors = corsHeadersForRequest(req);
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRoleKey) {
      console.error("auth-second-factor: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return json({ error: "missing_function_env" }, 500);
    }

    const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const rawEmail = body.email?.trim() ?? "";
    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
      return json({ error: "invalid_email" }, 400);
    }
    const email = normalizeEmail(rawEmail);
    const locale: "ko" | "en" = body.locale === "en" ? "en" : "ko";

    if (body.action === "send_code") {
      const code = createRandomCode(CODE_LENGTH);
      const codeHash = await hashCode(code);

      const invalidate = await admin
        .from("auth_email_challenges")
        .update({ consumed_at: new Date().toISOString() })
        .eq("email", email)
        .is("consumed_at", null);
      if (invalidate.error) {
        return json({ error: invalidate.error.message }, 400);
      }

      const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60_000).toISOString();
      const { error: insertError } = await admin.from("auth_email_challenges").insert({
        email,
        code_hash: codeHash,
        expires_at: expiresAt,
      });
      if (insertError) {
        return json({ error: insertError.message }, 400);
      }

      const sent = await sendCodeEmail(email, code, locale);
      if (!sent.ok) {
        const err = sent.error ?? "email_send_failed";
        const status = err === "missing_email_provider_env" ? 503 : 502;
        return json({ error: err }, status);
      }

      return json({ ok: true, expiresAt });
    }

    if (body.action === "verify_code") {
      const rawCode = body.code?.trim().toUpperCase();
      if (!rawCode || rawCode.length !== CODE_LENGTH) {
        return json({ error: "invalid_code_format" }, 400);
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
        return json({ error: selectError.message }, 400);
      }
      if (!latestCode) {
        return json({ error: "code_not_found" }, 404);
      }

      const now = Date.now();
      const expiresAtMs = Date.parse(latestCode.expires_at);
      const nowIso = new Date(now).toISOString();
      if (!Number.isFinite(expiresAtMs)) {
        await admin.from("auth_email_challenges").update({ consumed_at: nowIso }).eq("id", latestCode.id);
        return json({ error: "code_expired" }, 400);
      }
      if (expiresAtMs <= now) {
        await admin.from("auth_email_challenges").update({ consumed_at: nowIso }).eq("id", latestCode.id);
        return json({ error: "code_expired" }, 400);
      }

      if ((latestCode.attempt_count ?? 0) >= MAX_VERIFY_ATTEMPTS) {
        await admin.from("auth_email_challenges").update({ consumed_at: nowIso }).eq("id", latestCode.id);
        return json({ error: "code_locked" }, 429);
      }

      const incomingHash = await hashCode(rawCode);
      if (incomingHash !== latestCode.code_hash) {
        await admin
          .from("auth_email_challenges")
          .update({ attempt_count: (latestCode.attempt_count ?? 0) + 1 })
          .eq("id", latestCode.id);
        return json({ error: "code_mismatch" }, 400);
      }

      const { error: consumeError } = await admin
        .from("auth_email_challenges")
        .update({ consumed_at: nowIso, magic_link_sent_at: nowIso })
        .eq("id", latestCode.id);
      if (consumeError) {
        return json({ error: consumeError.message }, 400);
      }

      return json({ ok: true, codeVerified: true });
    }

    if (body.action === "sq_begin") {
      const invalidateSq = await admin
        .from("auth_sq_quarter_challenges")
        .update({ consumed_at: new Date().toISOString() })
        .eq("email", email)
        .is("consumed_at", null);
      if (invalidateSq.error) {
        return json({ error: invalidateSq.error.message }, 400);
      }

      const colorKeys = SQ_COLOR_KEYS as readonly string[];
      const rk = SQ_COLOR_KEYS[crypto.getRandomValues(new Uint8Array(1))[0]! % SQ_COLOR_KEYS.length];
      const solution_color_key = rk;
      const usedCodes = new Set<string>();
      const perColor = new Map<string, string>();

      for (const key of colorKeys) {
        let c = "";
        for (let n = 0; n < 12; n++) {
          const candidate = createRandomCode(CODE_LENGTH);
          if (!usedCodes.has(candidate)) {
            usedCodes.add(candidate);
            c = candidate;
            break;
          }
        }
        if (!c) return json({ error: "sq_code_generation_failed" }, 500);
        perColor.set(key, c);
      }

      const solutionCode = perColor.get(solution_color_key)!;
      const code_hash = await hashCode(solutionCode);
      const expiresIso = new Date(Date.now() + SQ_EXPIRY_MINUTES * 60_000).toISOString();

      const { data: inserted, error: insErr } = await admin
        .from("auth_sq_quarter_challenges")
        .insert({
          email,
          solution_color_key,
          code_hash,
          expires_at: expiresIso,
        })
        .select("id")
        .single();

      if (insErr || !inserted?.id) {
        return json({ error: insErr?.message ?? "sq_insert_failed" }, 400);
      }

      const tiles = shuffleSqTiles(colorKeys.map((color_key) => ({
        colorKey: color_key,
        code: perColor.get(color_key)!,
      })));

      return json({
        ok: true,
        challengeId: inserted.id,
        instructionColorKey: solution_color_key,
        tiles,
        expiresAt: expiresIso,
      });
    }

    if (body.action === "sq_verify") {
      const challengeId = body.challengeId?.trim();
      const selectedColorKey = body.selectedColorKey?.trim();
      const rawSqCode = body.code?.trim().toUpperCase();
      const colorKeysFlat = SQ_COLOR_KEYS as readonly string[];

      if (
        !challengeId ||
        !selectedColorKey ||
        !colorKeysFlat.includes(selectedColorKey) ||
        !rawSqCode ||
        rawSqCode.length !== CODE_LENGTH
      ) {
        return json({ error: "invalid_sq_payload" }, 400);
      }

      const { data: row, error: selErr } = await admin
        .from("auth_sq_quarter_challenges")
        .select("id, email, solution_color_key, code_hash, expires_at, consumed_at, attempt_count")
        .eq("id", challengeId)
        .maybeSingle();

      if (selErr) return json({ error: selErr.message }, 400);
      if (!row || row.email !== email) return json({ error: "challenge_not_found" }, 404);

      const now = Date.now();
      const nowIso = new Date(now).toISOString();

      if (row.consumed_at) return json({ error: "challenge_consumed" }, 400);

      const expMs = Date.parse(row.expires_at);
      if (!Number.isFinite(expMs) || expMs <= now) {
        await admin.from("auth_sq_quarter_challenges").update({ consumed_at: nowIso }).eq("id", row.id);
        return json({ error: "challenge_expired" }, 400);
      }

      if ((row.attempt_count ?? 0) >= MAX_SQ_VERIFY_ATTEMPTS) {
        await admin.from("auth_sq_quarter_challenges").update({ consumed_at: nowIso }).eq("id", row.id);
        return json({ error: "sq_locked" }, 429);
      }

      if (selectedColorKey !== row.solution_color_key) {
        await admin
          .from("auth_sq_quarter_challenges")
          .update({ attempt_count: (row.attempt_count ?? 0) + 1 })
          .eq("id", row.id);
        return json({ error: "wrong_color_choice" }, 400);
      }

      const incomingHash = await hashCode(rawSqCode);
      if (incomingHash !== row.code_hash) {
        await admin
          .from("auth_sq_quarter_challenges")
          .update({ attempt_count: (row.attempt_count ?? 0) + 1 })
          .eq("id", row.id);
        return json({ error: "code_mismatch" }, 400);
      }

      await admin.from("auth_sq_quarter_challenges").update({ consumed_at: nowIso }).eq("id", row.id);
      return json({ ok: true, sqVerified: true });
    }

    return json({ error: "unsupported_action" }, 400);
  } catch (e) {
    console.error("auth-second-factor_unhandled", e instanceof Error ? e.message : e);
    return json({ error: "internal_error" }, 500);
  }
});
