import { avatarFallbackLetter, isMissingAvatarUrl } from "@/lib/avatarUtils";

export type ProfileAvatarProps = {
  imageUrl: string | null | undefined;
  /** Prefer account email for the signed-in user; otherwise username is fine. */
  fallbackSource: string | null | undefined;
  alt: string;
  boxClassName: string;
  textClassName?: string;
  className?: string;
};

/**
 * Square bordered avatar matching the customize/onboarding preview (image or initial).
 */
export function ProfileAvatar({
  imageUrl,
  fallbackSource,
  alt,
  boxClassName,
  textClassName = "text-xl",
  className = "",
}: ProfileAvatarProps) {
  const showImg = !isMissingAvatarUrl(imageUrl);
  const letter = avatarFallbackLetter(fallbackSource);

  return (
    <div
      className={`shrink-0 border border-border overflow-hidden flex items-center justify-center bg-muted font-bold font-mono text-foreground/90 ${boxClassName} ${className}`}
      aria-label={showImg ? undefined : alt}
    >
      {showImg ? (
        <img src={imageUrl!.trim()} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className={textClassName} aria-hidden>
          {letter}
        </span>
      )}
    </div>
  );
}
