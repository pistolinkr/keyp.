import { useCallback, useRef, useState } from "react";
import type { SlideGateConfig } from "@/lib/slideGateEnv";

const KNOB_PX = 44;
const TRACK_PAD_X = 4;

type SlideHumanGateProps = {
  config: SlideGateConfig;
  lang: "ko" | "en";
  disabled?: boolean;
  onHumanVerified: () => void;
  onBotSuspected: () => void;
  onGestureIncomplete?: () => void;
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function coeffOfVariation(values: number[]): number {
  if (values.length < 2) return Number.POSITIVE_INFINITY;
  const m = mean(values);
  if (Math.abs(m) < 1e-12) return Number.POSITIVE_INFINITY;
  let s = 0;
  for (const v of values) {
    const d = v - m;
    s += d * d;
  }
  const variance = s / values.length;
  const sd = Math.sqrt(variance);
  return sd / Math.abs(m);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** z-30 overlay; parent keeps Turnstile out of DOM until onHumanVerified. ~65px height like Turnstile flexible. */
export function SlideHumanGate({
  config,
  lang,
  disabled = false,
  onHumanVerified,
  onBotSuspected,
  onGestureIncomplete,
}: SlideHumanGateProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const [knobPx, setKnobPx] = useState(0);
  const maxPxSeen = useRef(0);

  const speeds = useRef<number[]>([]);
  const lastSample = useRef<{ t: number; px: number } | null>(null);

  /** Map clientX → knob left offset in px along usable track segment. */
  const clientToKnobPx = useCallback((clientX: number): { px: number; usable: number } => {
    const track = trackRef.current;
    if (!track) return { px: 0, usable: 0 };
    const rect = track.getBoundingClientRect();
    const usable = rect.width - 2 * TRACK_PAD_X - KNOB_PX;
    const u = Math.max(0, usable);
    if (u <= 0) return { px: 0, usable: u };
    const xRaw = clientX - rect.left - TRACK_PAD_X;
    const px = clamp(xRaw, 0, u);
    return { px, usable: u };
  }, []);

  const resetTelemetry = () => {
    speeds.current = [];
    lastSample.current = null;
  };

  const resetVisual = () => {
    maxPxSeen.current = 0;
    setKnobPx(0);
  };

  const pushSpeedSample = (px: number, t: number) => {
    const prev = lastSample.current;
    lastSample.current = { t, px };
    if (!prev) return;
    const dt = t - prev.t;
    if (dt < 4) return;
    const dpx = px - prev.px;
    speeds.current.push(Math.abs(dpx) / dt);
    if (speeds.current.length > 90) speeds.current.shift();
  };

  const finishGesture = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;

    let u = 0;
    const el = trackRef.current;
    if (el) {
      const rw = el.getBoundingClientRect().width;
      u = Math.max(0, rw - 2 * TRACK_PAD_X - KNOB_PX);
    }

    const maxP = u > 0 ? maxPxSeen.current / u : 0;

    const sampleLen = speeds.current.length;

    const cv =
      sampleLen >= config.minSpeedSamples ? coeffOfVariation([...speeds.current]) : Number.POSITIVE_INFINITY;

    const steady = Number.isFinite(cv) && cv <= config.botCvMax;

    resetTelemetry();

    if (sampleLen < config.minSpeedSamples) {
      resetVisual();
      onGestureIncomplete?.();
      return;
    }

    if (steady && maxP >= config.botPathRatio) {
      resetVisual();
      onBotSuspected();
      return;
    }

    if (!steady) {
      onHumanVerified();
      return;
    }

    resetVisual();
    onGestureIncomplete?.();
  }, [
    config.botCvMax,
    config.botPathRatio,
    config.minSpeedSamples,
    onBotSuspected,
    onGestureIncomplete,
    onHumanVerified,
  ]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    dragging.current = true;
    pointerIdRef.current = e.pointerId;
    resetTelemetry();
    const { px, usable } = clientToKnobPx(e.clientX);
    if (usable <= 0) return;
    maxPxSeen.current = px;
    setKnobPx(px);
    lastSample.current = { t: performance.now(), px };
    trackRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || disabled || e.pointerId !== pointerIdRef.current) return;
    const { px, usable } = clientToKnobPx(e.clientX);
    if (usable <= 0) return;
    maxPxSeen.current = Math.max(maxPxSeen.current, px);
    setKnobPx(px);
    pushSpeedSample(px, performance.now());
  };

  const onPointerEnd = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current) return;
      const tid = pointerIdRef.current;
      pointerIdRef.current = null;
      if (tid != null && trackRef.current?.hasPointerCapture(tid)) {
        trackRef.current.releasePointerCapture(tid);
      }
      finishGesture();
    },
    [finishGesture],
  );

  const instruction =
    lang === "ko"
      ? "이 영역만큼 브라우저에서 검증 후 Cloudflare 확인이 선택적으로 열립니다."
      : "Slide here first; Cloudflare CAPTCHA appears only after a human-like gesture when configured via env.";

  return (
    <div className={`relative z-30 w-full min-w-0 ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <span className="mb-1.5 block text-sm font-medium">
        {lang === "ko" ? "사이트 인증 (슬라이드)" : "Site verification (slide)"}
      </span>
      <p className="mb-2 text-xs text-muted-foreground">{instruction}</p>

      <div className="relative h-[65px] w-full min-w-0 border border-border bg-muted/40">
        <div
          aria-hidden
          className="pointer-events-none absolute left-14 right-14 top-1/2 h-px -translate-y-1/2 bg-border"
        />

        <div
          ref={trackRef}
          role="slider"
          className="relative h-full w-full cursor-pointer touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 flex h-11 max-h-[calc(100%-8px)] w-11 -translate-y-1/2 items-center justify-center border border-border bg-background font-mono text-xs shadow-sm transition-none"
            style={{
              left: TRACK_PAD_X + knobPx,
            }}
          >
            →
          </div>
        </div>
      </div>
    </div>
  );
}
