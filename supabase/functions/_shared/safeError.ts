/**
 * W1 / recon: never return raw Postgres or client library messages to the browser.
 * Log server-side; expose stable, minimal error codes only.
 */
export function logPostgrestError(
  context: string,
  err: { message: string; code?: string; details?: string; hint?: string } | null | undefined,
): void {
  if (!err) return
  console.error(`[edge] ${context}`, {
    code: err.code,
    message: err.message,
    details: err.details,
    hint: err.hint,
  })
}

export const E = {
  db: { error: "database_error" as const },
  internal: { error: "internal_error" as const },
} as const
