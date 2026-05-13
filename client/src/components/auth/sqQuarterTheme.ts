/** Panel + email illustration tokens aligned with design/email-templates (Pencil). */

export type SqColorKey = "sapphire" | "emerald" | "ruby" | "amber" | "violet";

export const SQ_THEME: Record<
  SqColorKey,
  {
    labelKo: string;
    labelEn: string;
    bg: string;
    border: string;
    fg: string;
  }
> = {
  sapphire: {
    labelKo: "파랑(사파이어)",
    labelEn: "Blue (sapphire)",
    bg: "#D6EEFF",
    border: "#AACCE8",
    fg: "#1A1A1A",
  },
  ruby: {
    labelKo: "로즈/루비",
    labelEn: "Rose (ruby)",
    bg: "#FFD6E7",
    border: "#FFADD0",
    fg: "#1A1A1A",
  },
  emerald: {
    labelKo: "에메랄드",
    labelEn: "Emerald",
    bg: "#D6F5E3",
    border: "#A8E6C3",
    fg: "#1A1A1A",
  },
  violet: {
    labelKo: "바이올렛",
    labelEn: "Violet",
    bg: "#E8D6FF",
    border: "#C9A8E6",
    fg: "#1A1A1A",
  },
  amber: {
    labelKo: "앰버",
    labelEn: "Amber",
    bg: "#FFF4D6",
    border: "#EBD199",
    fg: "#1A1A1A",
  },
};

export function sqInstructionLabel(colorKey: SqColorKey, lang: "ko" | "en"): string {
  const t = SQ_THEME[colorKey];
  return lang === "ko" ? t.labelKo : t.labelEn;
}
