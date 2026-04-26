# Penetration testing playbook — Keyp platform

This document is scoped to **this repository**: Vite + React client, optional Express Node server, Vercel serverless `/api/ai/*`, Supabase (Postgres, Auth, Storage, Edge Functions), and Ollama-backed AI. Use it for **internal** assessments, **pre-release** checks, and **scheduled** retests.

---

## 1. Scope and rules of engagement

### 1.1 In scope (typical)

| Layer | Examples |
|--------|-----------|
| **SPA** | All routes under `client/src/pages/`, auth flows, editor, post detail, profile |
| **HTTP APIs** | `POST /api/ai/summary`, `/api/ai/assistant`, `/api/ai/translate` (Vercel + same-origin + `VITE_AI_API_BASE_URL` targets) |
| **Supabase** | PostgREST (`/rest/v1/`), Auth (`/auth/v1/`), Realtime, Storage, Edge Functions (`engagement`, `auth-second-factor`, others you deploy) |
| **Infra** | Docker AI stack (`scripts/docker-ai-stack.sh`), `AI_CORS_ORIGIN`, Ollama reachability |

### 1.2 Out of scope (unless explicitly authorized)

- Third-party providers (Resend, Vercel platform, Supabase cloud control plane) except **your** integration surface.
- Social engineering of employees, physical access, DDoS at line rate against production (use **staging** or **throttled** abuse tests).
- Destructive tests on **production** data (use staging or disposable project).

### 1.3 Safety

- Use **dedicated test accounts**; never use real user credentials without written approval.
- Record **time window**, **tester identity**, and **target environment** in the report.
- Stop on **account lockout** or **provider abuse flags**; escalate before resuming.

---

## 2. Pre-engagement checklist

- [ ] Staging (or prod) **base URL** for SPA: `________________`
- [ ] **Supabase URL** and confirm you have **two** test users (User A / User B) with known passwords or magic-link flow.
- [ ] **Anon key** (from public client bundle — expected); confirm you are **not** using service role in the browser.
- [ ] **Vercel / API** base for AI: same origin vs `VITE_AI_API_BASE_URL` — document which is used in this run.
- [ ] Edge function URLs (e.g. `.../functions/v1/engagement`, `.../functions/v1/auth-second-factor`).
- [ ] Burp / ZAP / curl + `jq` available; optional Playwright for XSS checks.

---

## 3. Test matrix (run in order: recon → unauthenticated → authenticated → cross-user)

Legend: **P** = pass (expected secure behavior), **F** = fail (vulnerability or unclear).

### 3.1 Reconnaissance and information disclosure

| ID | Test | Steps | P / F |
|----|--------|--------|--------|
| R1 | Exposed client secrets | Open prod SPA → DevTools → Sources; search for `service_role`, private keys, internal URLs. | `service_role` must **not** appear. |
| R2 | Source maps in prod | Fetch `assets/*.js.map` if referenced. | Should be **absent** or access-controlled. |
| R3 | API error bodies | Provoke 4xx/5xx on AI and Edge; check JSON for stack traces, internal paths, **tokens**. | No secrets or stack in response. |
| R4 | `VITE_DEV_USER_EMAIL` in bundle | Grep built assets for `VITE_DEV`, `local-dev`, `keyp.local.dev`. | **No** dev bypass in prod. |

**Tools:** browser DevTools, `curl -s https://<host>/assets/<hash>.js \| strings`, optional `nmap` (only if permitted).

---

### 3.2 Unauthenticated AI abuse (Vercel / Node)

**Code reference:** `api/lib/vercelAiHandler.ts`, `server/ai.ts`, `client/src/lib/aiApi.ts`.

| ID | Test | Steps | P / F |
|----|--------|--------|--------|
| A1 | No-auth inference | `curl -X POST https://<host>/api/ai/assistant -H "Content-Type: application/json" -d '{"message":"x","content":"","title":"","lang":"en","history":[]}'` | If **200** and full reply, document unauthenticated use (expected fix: require JWT or reject). |
| A2 | Payload size / rate | 50 parallel requests with **maximal** `content` length (within server limits). | **429/503** or stable latency; not **full** CPU hang or unbounded **200**s. |
| A3 | CORS (Express path) | If AI is on a separate origin with `AI_CORS_ORIGIN`, send `Origin: https://evil.example` and compare with allowlist. | Only listed origins (or `*` if intentionally public) as designed. |

**Record:** status codes, response time p95, Ollama host CPU if you have access.

---

### 3.3 Supabase: authentication and session

| ID | Test | Steps | P / F |
|----|--------|--------|--------|
| S1 | Magic link / OTP | Complete login; capture whether tokens land in **URL hash** (transient) vs storage. | Session established; no token in long-lived **logs** (referrer). |
| S2 | Logout / refresh | Sign out; confirm `localStorage` keys for `sb-*-auth` cleared or session invalid. | Old token **rejected** by `getUser` / REST. |
| S3 | Password reset / email change | (If enabled) try token reuse, expired link. | Single use / expiry enforced (GoTrue defaults). |

---

### 3.4 Authorization and IDOR (RLS)

| ID | Test | Steps | P / F |
|----|--------|--------|--------|
| Z1 | Draft isolation | As User A, create a **draft** article; as User B, `GET` `articles` / `article_contents` for A’s `id` via PostgREST with B’s JWT. | **Empty** or **401/403**; not full body. |
| Z2 | Comment ownership | As B, `PATCH`/`DELETE` A’s comment if exposed — usually via your Edge `engagement` or RLS. | **403** or no row updated. |
| Z3 | Profile updates | B tries `PATCH profiles` for A’s `id`. | RLS **rejects** (only `auth.uid() = id`). |
| Z4 | Storage objects | B requests signed URL or object for A’s upload path (if paths are guessable). | **Denied**. |

**Tooling:** `curl` + `Authorization: Bearer <user_b_jwt>` and `apikey: <anon_key>` to PostgREST.

---

### 3.5 Edge Functions

**Targets:** e.g. `engagement` (`supabase/functions/engagement/index.ts`), `auth-second-factor`.

| ID | Test | Steps | P / F |
|----|--------|--------|--------|
| E1 | CORS | `curl -I -X OPTIONS <function_url> -H "Origin: https://evil.com"` | Document `Access-Control-Allow-Origin` (allowlist vs `*`). |
| E2 | Unauthenticated | POST without `Authorization`. | **401** for protected actions. |
| E3 | Cross-user `articleId` / `action` | Valid user A performs `comment_create` on arbitrary `articleId` (draft of B, non-existent, etc.) | Fails or only **published** community rules; no write to B’s private content. |
| E4 | 2FA email flood | Script `send_code` with target email (staging only, low rate). | **Throttled**; not unlimited sends. |
| E5 | 2FA brute force | >5 wrong codes for one email. | **Locked** or **rate limited** (see `MAX_VERIFY_ATTEMPTS` in function). |

---

### 3.6 XSS, HTML injection, and CSP

**High-risk code path:** `client/src/pages/PostDetailPage.tsx` (`dangerouslySetInnerHTML` for article body). Comments use plain text in React (lower risk if truly escaped).

| ID | Test | Steps | P / F |
|----|--------|--------|--------|
| X1 | Stored HTML in post | As author, try body: `<img src=x onerror=alert(1)>`; load post. | Alert **must not** fire; or editor **rejects** / server **strips** tags. |
| X2 | Reflected in URL (search, errors) | `?q=<script>...` in search or error pages. | **Encoded** in DOM. |
| X3 | CSP | `curl -I https://<host>/ \| grep -i content-security` | Tighten over time: at minimum document **absence** vs policy. |

**Optional:** Playwright `page.on('dialog')` or `page.addInitScript` to detect `alert`.

---

### 3.7 CSRF

| ID | Test | Steps | P / F |
|----|--------|--------|--------|
| C1 | State-changing with cookies | (If you add cookie session later) cross-site form POST. | N/A for pure Bearer in `localStorage` + SPA. |
| C2 | Supabase with `apikey` only | Unauthenticated `POST` to REST without user JWT. | RLS should **block** user-owned writes. |

---

### 3.8 Rate limiting and availability

| ID | Test | Steps | P / F |
|----|--------|--------|--------|
| L1 | Signup / sign-in | 30 failed attempts from one IP. | **429** or lockout. |
| L2 | Engagement API | High-frequency `upvote_toggle` (script). | **429** or stable **200** without DB melt (document baseline). |
| L3 | Post view / analytics endpoints | (If public) cache bypass storm. | No critical **5xx** cascade. |

---

## 4. Tooling (minimal set)

| Tool | Use |
|------|-----|
| **curl** + **httpx** | API fuzzing, headers |
| **Burp Community / OWASP ZAP** | Map SPA, passive scan, **manual** follow-up (no fire-and-forget for APIs) |
| **Playwright** | XSS, auth flows, regression |
| **psql** or Supabase SQL editor | Verify RLS as postgres if you have staging DB role |
| **supabase-js** in a throwaway script | Reproduce RLS with two users |

---

## 5. Reporting template

```text
Title: [STAGING|PROD] Keyp pen test — <date>
Tester: <name>
Environment: <URLs>

Executive summary:
- Critical: <n>
- High: <n>
- Medium: <n>
- Low: <n>
- Informational: <n>

Findings (repeat per finding)

ID: PT-2026-001
Title: <short>
Severity: Critical|High|Medium|Low|Info
Asset: e.g. Vercel /api/ai/assistant

Description: <what is wrong>
Steps to reproduce:
1. ...
2. ...
Evidence: <sanitized request/response, screenshot>

Root cause: <e.g. missing auth on Vercel handler>
Recommendation: <specific change, e.g. verify JWT in createVercelAiHandler>
References: OWASP <sheet>, file path in repo

Retest: <date> after fix; expected P on test matrix ID <A1>
```

---

## 6. Remediation and retest

- Map each finding to a **test matrix ID** (e.g. A1) so retest is one script.
- **Critical/High:** fix + retest before prod promote.
- **Recurring:** run **A1, X1, Z1, E2** on every **major** release (15–30 min).

---

## 7. Out of band — supply chain and ops

- [ ] `pnpm audit` / lockfile review on release branch.
- [ ] Supabase project: **MFA** on dashboard; **no** shared `service_role` in CI logs.
- [ ] Vercel: environment variables not exposed in build logs; **no** `docker.env` in git (use `.gitignore`).

---

*This playbook is internal documentation. For external pen tests, attach a legal scope letter and a technical appendix derived from this file.*
