#!/usr/bin/env bash
# Quick checks after hardening. Usage: ./scripts/security-smoke.sh [BASE_URL]
# Example: ./scripts/security-smoke.sh https://app.example.com
set -euo pipefail
BASE="${1:-http://127.0.0.1:3000}"
echo "== AI without Authorization (expect 401 if auth not disabled) =="
code="$(curl -sS -o /tmp/ai-b.json -w "%{http_code}" -X POST "$BASE/api/ai/summary" \
  -H "Content-Type: application/json" \
  -d '{"content":"test","lang":"en"}' || true)"
echo "HTTP $code"
head -c 200 /tmp/ai-b.json; echo
if [[ "$code" == "200" ]]; then
  echo "WARNING: unauthenticated AI allowed — set auth or remove AI_DISABLE_AUTH in prod"
fi
echo "Done."
