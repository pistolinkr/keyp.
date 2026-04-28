/** First character for avatar fallback (email, username, etc.). */
export function avatarFallbackLetter(source: string | null | undefined): string {
  const s = source?.trim();
  if (!s) return "?";
  return s.charAt(0).toLocaleUpperCase();
}

const LEGACY_UNSPLASH_PLACEHOLDER =
  "images.unsplash.com/photo-1618005182384-a83a8bd57fbe";

/** True when we should show the initial instead of loading this URL. */
export function isMissingAvatarUrl(url: string | null | undefined): boolean {
  const u = url?.trim() ?? "";
  if (!u) return true;
  if (u === "/placeholder.svg") return true;
  if (u.includes(LEGACY_UNSPLASH_PLACEHOLDER)) return true;
  return false;
}
