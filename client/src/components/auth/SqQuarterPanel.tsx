import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { beginSqQuarterChallenge, verifySqQuarterChallenge } from "@/lib/authSecondFactor";
import { type SqColorKey, SQ_THEME, sqInstructionLabel } from "@/components/auth/sqQuarterTheme";

type SqTileWire = {
  colorKey: SqColorKey;
  code: string;
};

export type SqQuarterPanelProps = {
  email: string;
  lang: "ko" | "en";
  onPassed: () => void;
};

function parseSqBegin(data: Record<string, unknown>): {
  challengeId: string;
  instructionColorKey: SqColorKey;
  tiles: SqTileWire[];
} | null {
  const challengeId = typeof data.challengeId === "string" ? data.challengeId : "";
  const instructionColorKey = data.instructionColorKey as SqColorKey;
  const keys: SqColorKey[] = ["sapphire", "emerald", "ruby", "amber", "violet"];
  const tilesUnknown = Array.isArray(data.tiles) ? data.tiles : [];
  const tiles: SqTileWire[] = [];
  for (const row of tilesUnknown) {
    if (!row || typeof row !== "object") continue;
    const r = row as { colorKey?: unknown; code?: unknown };
    const ck = r.colorKey;
    const code = r.code;
    if (typeof ck === "string" && keys.includes(ck as SqColorKey) && typeof code === "string") {
      tiles.push({ colorKey: ck as SqColorKey, code });
    }
  }
  if (!challengeId || !keys.includes(instructionColorKey) || tiles.length !== 5) return null;
  return { challengeId, instructionColorKey, tiles };
}

export function SqQuarterPanel({ email, lang, onPassed }: SqQuarterPanelProps) {
  const [busy, setBusy] = useState(true);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [instructionColorKey, setInstructionColorKey] = useState<SqColorKey | null>(null);
  const [tiles, setTiles] = useState<SqTileWire[]>([]);
  const [activeColor, setActiveColor] = useState<SqColorKey | null>(null);
  const [revealed, setRevealed] = useState<Partial<Record<SqColorKey, boolean>>>({});
  const [codeInput, setCodeInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const instructionColorName = useMemo(() => {
    if (!instructionColorKey) return "";
    return sqInstructionLabel(instructionColorKey, lang);
  }, [instructionColorKey, lang]);

  const load = useCallback(async () => {
    setBusy(true);
    const res = await beginSqQuarterChallenge(email);
    if (res.error) {
      toast.error(
        lang === "ko"
          ? "SQ(Secured Quarter) 단계를 불러오지 못했습니다."
          : "Could not load Secured Quarter challenge.",
      );
      setBusy(false);
      return;
    }
    const parsed = parseSqBegin(res.data ?? {});
    if (!parsed) {
      toast.error(lang === "ko" ? "SQ 응답 형식이 올바르지 않습니다." : "Malformed SQ challenge response.");
      setBusy(false);
      return;
    }
    setChallengeId(parsed.challengeId);
    setInstructionColorKey(parsed.instructionColorKey);
    setTiles(parsed.tiles);
    setActiveColor(null);
    setRevealed({});
    setCodeInput("");
    setBusy(false);
  }, [email, lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const onReveal = (tile: SqTileWire) => {
    setActiveColor(tile.colorKey);
    setCodeInput(tile.code.trim().toUpperCase());
    setRevealed((prev) => ({ ...prev, [tile.colorKey]: true }));
    try {
      const el =
        typeof document !== "undefined"
          ? document.getElementById(`sq-token-${tile.colorKey}`)
          : null;
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch {
      /* ignore scroll */
    }
  };

  const onSubmitSq = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!challengeId || !activeColor || !instructionColorKey) {
      toast.error(
        lang === "ko"
          ? "안내색과 같은 색 버튼을 먼저 눌러 코드를 불러오세요."
          : "Tap the instructed color tile on this page to load its code (same window—no new tab).",
      );
      return;
    }
    const code = codeInput.trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      toast.error(
        lang === "ko"
          ? "코드는 영문 대문자·숫자 8자리여야 합니다."
          : "Code must be 8 alphanumeric characters.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await verifySqQuarterChallenge({
        email,
        challengeId,
        selectedColorKey: activeColor,
        code,
      });
      if (result.error) {
        const k = result.error.message;
        if (k === "wrong_color_choice") {
          toast.error(
            lang === "ko"
              ? "색 버튼이 안내와 다릅니다. 안내한 색 버튼을 눌러 표시되는 코드만 사용해 주세요."
              : "Color choice does not match the instructions.",
          );
        } else if (k === "code_mismatch") {
          toast.error(lang === "ko" ? "코드가 맞지 않습니다." : "Code does not match.");
        } else if (k === "challenge_expired" || k === "sq_locked") {
          toast.error(
            lang === "ko"
              ? "시간 초과 또는 시도 초과입니다. 다시 시작합니다."
              : "Expired or locked. Reloading SQ challenge.",
          );
          void load();
        } else {
          toast.error(lang === "ko" ? "SQ 인증에 실패했습니다." : "SQ verification failed.");
        }
        return;
      }
      toast.success(lang === "ko" ? "Secured Quarter(SQ) 확인 완료" : "Secured Quarter (SQ) completed");
      onPassed();
    } finally {
      setSubmitting(false);
    }
  };

  const title = lang === "ko" ? "SQ 이중인증 (Secured Quarter)" : "Secured Quarter (SQ) 2FA";
  const help =
    lang === "ko"
      ? `${instructionColorName} 버튼을 이 페이지 안에서 탭하면(새 창 아님) 표시되는 8자 문자·숫자 코드가 입력란에 채워집니다. 맞으면 「SQ 확인」으로 진행하세요. 타일 순서가 다를 수 있습니다.`
      : `On this same page — no new tab — tap the ${instructionColorName} tile and use the alphanumeric 8-character code that appears beneath it (we pre-fill the field). Then submit SQ verify. Tiles may be ordered differently for each session.`;

  if (busy) {
    return (
      <section className="space-y-2" aria-busy="true">
        <div className="h-1 rounded-full bg-primary/70" />
        <p className="text-sm text-muted-foreground">{lang === "ko" ? "SQ 단계 불러오는 중…" : "Loading SQ…"}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label={title}>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="h-1 rounded-t-lg" style={{ backgroundColor: "#e9a91f" }} />
        <div className="p-4 space-y-3">
          <h2 className="font-semibold text-lg">{title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{help}</p>
          <p className="text-sm font-medium text-foreground">
            {lang === "ko" ? (
              <>
                요구되는 색: <span style={{ color: "#1a1a1a" }}>{instructionColorName}</span>
              </>
            ) : (
              <>
                Tap the color:&nbsp;<span>{instructionColorName}</span>
              </>
            )}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tiles.map((tile) => {
              const th = SQ_THEME[tile.colorKey];
              const isOpen = !!revealed[tile.colorKey];
              return (
                <div key={tile.colorKey} className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="min-h-[52px] w-full rounded-xl border px-3 py-3 text-center text-sm font-medium transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      backgroundColor: th.bg,
                      borderColor: th.border,
                      color: th.fg,
                    }}
                    onClick={() => onReveal(tile)}
                    aria-pressed={isOpen && activeColor === tile.colorKey}
                    aria-expanded={isOpen}
                    aria-label={
                      lang === "ko"
                        ? `${SQ_THEME[tile.colorKey].labelKo} 버튼, 탭하면 이 페이지 위치에 표시되는 코드 확인`
                        : `${SQ_THEME[tile.colorKey].labelEn} tile — reveals code below on this page`
                    }
                  >
                    {SQ_THEME[tile.colorKey][lang === "ko" ? "labelKo" : "labelEn"]}
                  </button>
                  <div
                    id={`sq-token-${tile.colorKey}`}
                    className={
                      `rounded-lg border px-3 py-2 text-center font-mono text-xl tracking-[0.18em] ` +
                      (isOpen ? "opacity-100" : "opacity-40 blur-sm select-none")
                    }
                    style={{
                      backgroundColor: "#fafafa",
                      borderColor: th.border,
                    }}
                    aria-hidden={!isOpen}
                  >
                    {isOpen ? tile.code.toUpperCase() : "········"}
                  </div>
                </div>
              );
            })}
          </div>

          <form className="space-y-3 border-t border-border pt-3" onSubmit={onSubmitSq}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">
                {lang === "ko"
                  ? "선택한 색 버튼의 코드 (문자·숫자 혼합 8자)"
                  : "8-character code from the tapped tile"}
              </span>
              <input
                type="text"
                value={codeInput}
                onChange={(event) =>
                  setCodeInput(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
                }
                className="h-11 w-full border border-border bg-background px-3 font-mono tracking-[0.18em] text-foreground focus:border-primary focus:outline-none"
                placeholder={lang === "ko" ? "타일 코드" : "From tile"}
                maxLength={8}
                spellCheck={false}
                disabled={submitting}
                autoCapitalize="characters"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={submitting} className="flex-1 min-w-[120px] keyp-btn-primary h-11 text-sm">
                {submitting
                  ? lang === "ko"
                    ? "확인 중…"
                    : "Verifying…"
                  : lang === "ko"
                    ? "SQ 확인"
                    : "Verify SQ"}
              </button>
              <button
                type="button"
                className="h-11 border border-border px-4 text-sm hover:bg-accent"
                onClick={() => void load()}
                disabled={busy || submitting}
              >
                {lang === "ko" ? "다시 시작" : "Restart"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
