type Lang = "ko" | "en";

export function formatPostedAgo(isoDate: string, lang: Lang): string {
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) {
    return lang === "ko" ? "방금 전" : "just now";
  }

  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return lang === "ko" ? "방금 전" : "just now";

  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return lang === "ko" ? `${minutes}분 전` : `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === "ko" ? `${hours}시간 전` : `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return lang === "ko" ? `${days}일 전` : `${days}d ago`;

  return new Date(ts).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}
