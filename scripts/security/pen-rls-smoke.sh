#!/usr/bin/env bash
# Automated RLS / IDOR checks (W2, W5). Run against a disposable Supabase / staging.
#
# Required env:
#   SUPABASE_URL        https://xxx.supabase.co
#   SUPABASE_ANON_KEY   anon key
#   TEST_USER_A_JWT     access token for user A (e.g. from magic link session)
#   TEST_USER_B_ID     uuid of user B (profile id) — for negative test only
# Optional:
#   TEST_ARTICLE_A_ID   published article id owned by A (for state call)
#   DRY_RUN=1           only print what would be sent
#
set -euo pipefail
[ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_ANON_KEY:-}" ] || { echo "Set SUPABASE_URL and SUPABASE_ANON_KEY"; exit 1; }
[ -n "${TEST_USER_A_JWT:-}" ] || { echo "Set TEST_USER_A_JWT (access token for user A)"; exit 1; }

PGRST="${SUPABASE_URL}/rest/v1"
HDR_A=(-H "apikey: ${SUPABASE_ANON_KEY}" -H "Authorization: Bearer ${TEST_USER_A_JWT}" -H "Accept: application/json")

# W2: As A, list profiles with select=* — RLS should not expose all PII; adjust expected shape per policy.
# Expect: 200 with [] or a bounded set, NOT full-table dump of other users' private emails.
echo "== GET /profiles (as user A) — should not be unbounded PII on all users =="
if [ "${DRY_RUN:-0}" = "1" ]; then
  echo "curl -sS ${PGRST}/profiles?select=id,email ${HDR_A[*]}"
  exit 0
fi
code="$(curl -sS -o /tmp/rls-profiles.json -w "%{http_code}" "${PGRST}/profiles?select=id" "${HDR_A[@]}" || true)"
echo "HTTP $code"
# Heuristic: fail if array length looks like mass dump in CI (tune for your test seed)
# shellcheck disable=SC2012
bytes="$(wc -c < /tmp/rls-profiles.json 2>/dev/null || echo 0)"
if [ "$code" = "200" ] && [ "${bytes:-0}" -gt 2000000 ]; then
  echo "FAIL: /profiles response unusually large (${bytes} bytes) — check RLS (W2)"
  exit 1
fi
echo "OK: profiles size ${bytes} bytes (tune limit for your org)"

# W5: As A, try to read a draft of B if you set TEST_USER_B_DRAFT_ID
if [ -n "${TEST_USER_B_DRAFT_ID:-}" ]; then
  echo "== GET article by id (draft of B) — expect empty or 404 =="
  curl -sS -o /tmp/rls-draft.json -w "HTTP %{http_code}\n" \
    "${PGRST}/articles?select=id,status&id=eq.${TEST_USER_B_DRAFT_ID}&status=eq.draft" \
    "${HDR_A[@]}"
  if grep -q "\"id\"" /tmp/rls-draft.json 2>/dev/null; then
    echo "FAIL: user A can read B's draft (W5)"
    exit 1
  fi
  echo "OK: no cross-user draft row for A"
fi

echo "pen-rls-smoke: done"
