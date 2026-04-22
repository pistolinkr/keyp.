/*
 * KEYP. LANDING PAGE
 * Design: Sharp Editorial Intelligence
 * Hero section with geometric banner, platform intro, CTA
 */
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sun,
  Moon,
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  BookOpen,
  MessageSquare,
  Globe,
  Zap,
  Users,
  TrendingUp,
  Github,
  Mail,
} from "lucide-react";
import { NavbarScrollBlur } from "@/components/layout/NavbarScrollBlur";
import { toast } from "sonner";

const CORE_COLOR_2026 = "rgb(245, 220, 74)";
const CORE_TEXT_COLOR_2026 = "rgb(196, 164, 30)";
const LIGHT_THEME_TREND_COLOR_2026 = "#e9a91f";

interface LandingStat {
  value: string;
  label: string;
}

const parseStatTargetValue = (value: string) => {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function LandingStatCard({
  stat,
  index,
  isVisible,
}: {
  stat: LandingStat;
  index: number;
  isVisible: boolean;
}) {
  const target = parseStatTargetValue(stat.value);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setDisplayValue(0);
      return;
    }

    let rafId = 0;
    let startTime = 0;
    const durationMs = 1150;
    const delayMs = index * 120;

    const timeoutId = window.setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / durationMs, 1);
        const eased = 1 - (1 - progress) ** 3;
        setDisplayValue(Math.round(target * eased));
        if (progress < 1) {
          rafId = window.requestAnimationFrame(animate);
        }
      };

      rafId = window.requestAnimationFrame(animate);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [index, isVisible, target]);

  return (
    <div className={`relative overflow-hidden px-6 py-4 ${index < 3 ? "border-r border-border" : ""}`}>
      <div className="font-black text-3xl text-foreground mb-1" style={{ fontFamily: "Noto Sans KR", letterSpacing: "-0.04em" }}>
        {displayValue.toLocaleString("en-US")}
      </div>
      <div className="keyp-section-label">{stat.label}</div>
    </div>
  );
}

const TREND_KEYWORD_BRIEFS = [
  {
    keyword: "휴먼인더루프",
    keywordEn: "Human-in-the-Loop",
    summaryKo:
      "AI가 초안을 만들고 인간이 맥락을 최종 판단하는 협업 모델이 표준이 됩니다. 의사결정의 속도는 높아지되, 책임과 검증은 사람 중심으로 재정렬됩니다.",
    summaryEn:
      "AI drafts while humans make final contextual decisions. Organizations move faster, but accountability and validation remain human-centered.",
  },
  {
    keyword: "필코노미",
    keywordEn: "Philconomy",
    summaryKo:
      "결핍을 단순한 문제로 보지 않고 정체성과 소비를 형성하는 문화 코드로 해석하는 흐름입니다. 브랜드는 '무엇을 채워주나'보다 '왜 부족함을 느끼나'를 다루게 됩니다.",
    summaryEn:
      "Scarcity becomes a cultural code shaping identity and spending. Brands shift from filling needs to understanding why people feel lacking.",
  },
  {
    keyword: "제로클릭",
    keywordEn: "Zero-Click",
    summaryKo:
      "사용자가 클릭하기 전에 정보가 소비되는 인터페이스가 확산됩니다. 검색과 콘텐츠는 체류보다 즉시 이해를 제공하는 구조로 재편됩니다.",
    summaryEn:
      "Information is consumed before users click. Search and content ecosystems optimize for instant comprehension over page dwell time.",
  },
  {
    keyword: "레디코어",
    keywordEn: "Ready-Core",
    summaryKo:
      "준비된 상태 자체가 경쟁력이 되는 시대입니다. 개인과 조직은 실행 속도보다 사전 세팅, 템플릿, 운영 자동화 역량으로 차이를 만듭니다.",
    summaryEn:
      "Readiness itself becomes the edge. Teams compete through preconfigured systems, templates, and operational automation.",
  },
  {
    keyword: "AX조직",
    keywordEn: "AX Organization",
    summaryKo:
      "AI 전환은 도구 도입이 아니라 조직 구조의 재설계 문제로 이동합니다. 직무 경계가 유연해지고, 팀은 AI를 전제로 역할을 다시 정의합니다.",
    summaryEn:
      "AI transformation shifts from tools to org redesign. Role boundaries blur and teams redefine responsibilities with AI as a baseline.",
  },
  {
    keyword: "픽셀라이프",
    keywordEn: "Pixel Life",
    summaryKo:
      "오프라인 경험조차 디지털 레이어를 통해 기록, 공유, 평가되는 생활 방식이 일상화됩니다. 삶의 단위가 '장면'과 '데이터'로 동시 관리됩니다.",
    summaryEn:
      "Even offline experiences are logged, shared, and evaluated through digital layers. Life is managed as both moments and data.",
  },
  {
    keyword: "프라이스 디코딩",
    keywordEn: "Price Decoding",
    summaryKo:
      "소비자는 가격표가 아닌 가격의 구조를 읽기 시작합니다. 구독, 번들, 동적 요금제의 논리를 해석하는 능력이 구매 전략이 됩니다.",
    summaryEn:
      "Consumers decode pricing logic, not just tags. Interpreting subscriptions, bundles, and dynamic rates becomes a core buying skill.",
  },
  {
    keyword: "건강지능 HQ",
    keywordEn: "Health Intelligence HQ",
    summaryKo:
      "건강 관리의 중심이 병원 단일 접점에서 개인 데이터 허브로 이동합니다. 수면, 식습관, 스트레스 데이터가 생활 의사결정의 기본 입력값이 됩니다.",
    summaryEn:
      "Health management moves from hospital touchpoints to personal data hubs. Sleep, diet, and stress metrics become daily decision inputs.",
  },
  {
    keyword: "1.5가구",
    keywordEn: "1.5 Household",
    summaryKo:
      "1인 가구와 가족 가구의 중간 형태가 새로운 소비 단위로 부상합니다. 함께 살지 않아도 함께 소비하는 관계 기반 생활권이 확대됩니다.",
    summaryEn:
      "A new unit between solo and family households emerges. People consume together without necessarily living together.",
  },
  {
    keyword: "근본이즘",
    keywordEn: "Back-to-Basics",
    summaryKo:
      "과잉 정보 시대에 기본기와 본질로 회귀하려는 흐름이 강해집니다. 제품과 콘텐츠는 화려함보다 신뢰 가능한 핵심 가치로 평가받습니다.",
    summaryEn:
      "In an age of overload, people return to fundamentals. Products and content are judged more by trustworthy core value than novelty.",
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const [selectedTrendKeyword, setSelectedTrendKeyword] = useState<string>(TREND_KEYWORD_BRIEFS[0]?.keyword ?? "");
  const [isHeroCtaHovered, setIsHeroCtaHovered] = useState(false);
  const [heroCtaButtonWidth, setHeroCtaButtonWidth] = useState(0);
  const [heroCtaContainerWidth, setHeroCtaContainerWidth] = useState(0);
  const ctaBandImageRef = useRef<HTMLImageElement | null>(null);
  const ctaHeadlineRef = useRef<HTMLDivElement | null>(null);
  const ctaImageWrapRef = useRef<HTMLDivElement | null>(null);
  const heroCtaContainerRef = useRef<HTMLDivElement | null>(null);
  const heroCtaButtonRef = useRef<HTMLButtonElement | null>(null);
  const ctaTiltRef = useRef({
    currentX: 0,
    currentY: 0,
    currentScale: 1,
    targetX: 0,
    targetY: 0,
    targetScale: 1,
  });

  const content = {
    ko: {
      tagline: '한국의 맥락으로 읽고, 세계와 연결된다',
      subtitle: 'Keyp.는 한국 사회와 산업, 문화의 신호를 깊이 읽는 지식 커뮤니티입니다.',
      cta: '입장하기',
      trendSectionLabel: "KOREA CONTEXT BRIEF",
      trendTitle: "2026 한국 트렌드 키워드",
      trendSubtitle: "한국의 시장, 정책, 생활 변화에서 출발한 2026 핵심 키워드를 빠르게 파악합니다.",
      features: [
        { icon: BookOpen, title: '깊이 있는 글쓰기', desc: '한국 맥락을 중심에 둔 장문 에세이와 리포트. 아카이브로 축적됩니다.' },
        { icon: MessageSquare, title: '구조적 토론', desc: 'Reddit 스타일의 재귀적 댓글 스레드. 복잡한 논의도 명확하게 추적.' },
        { icon: Globe, title: '이중 언어 지원', desc: '모든 글을 한국어와 영어로. 언어의 장벽 없이 지식을 나눕니다.' },
        { icon: Zap, title: 'AI 글쓰기 보조', desc: '비침습적 AI 어시스턴트. 당신의 글쓰기를 방해하지 않고 도와드립니다.' },
        { icon: Users, title: '지식 커뮤니티', desc: '검증된 전문가와 열정적인 학습자가 함께하는 교육 생태계.' },
        { icon: TrendingUp, title: '트렌드 키워드', desc: '시장과 정책, 생활의 신호를 키워드로 빠르게 파악합니다.' },
      ],
      stats: [
        { value: '10', label: '추적 키워드' },
        { value: '0', label: '공개 게시글' },
        { value: '0', label: '토론 스레드' },
        { value: '0', label: '저장된 북마크' },
      ],
      ctaBandSub:
        "피드와 글쓰기를 바로 체험하고, 무료로 커뮤니티에 참여해 보세요.",
      ctaPrimary: "플랫폼 입장하기",
      ctaSecondary: "무료로 시작하기",
      footerNav1: "소개",
      footerNav2: "문의",
      footerNav3: "이메일",
      footerLegalStatus: "상태",
      footerLegalTerms: "이용약관",
      footerLegalPrivacy: "개인정보",
    },
    en: {
      tagline: 'Read Korea in context, connect to the world',
      subtitle: "Keyp. is a knowledge community grounded in Korea's social, industry, and cultural signals.\nDebate local issues in Korean, then expand them globally in English.",
      cta: 'Get Started',
      trendSectionLabel: "KOREA CONTEXT BRIEF",
      trendTitle: "2026 Trend Report",
      trendSubtitle: "Track 2026 signals rooted in Korean market shifts, policy changes, and daily life.",
      features: [
        { icon: BookOpen, title: 'Deep Writing', desc: 'Long-form essays and reports centered on Korean context, archived for the long term.' },
        { icon: MessageSquare, title: 'Structured Discussion', desc: 'Reddit-style recursive comment threads. Track complex discussions clearly.' },
        { icon: Globe, title: 'Bilingual Support', desc: 'Every post in Korean and English. Share knowledge without language barriers.' },
        { icon: Zap, title: 'AI Writing Assistant', desc: 'Non-invasive AI assistant. Helps your writing without getting in the way.' },
        { icon: Users, title: 'Knowledge Community', desc: 'An educational ecosystem where verified experts and passionate learners meet.' },
        { icon: TrendingUp, title: 'Trend Keywords', desc: 'Surface market, policy, and lifestyle signals through curated keywords.' },
      ],
      stats: [
        { value: '10', label: 'Tracked Keywords' },
        { value: '0', label: 'Public Posts' },
        { value: '0', label: 'Discussion Threads' },
        { value: '0', label: 'Saved Bookmarks' },
      ],
      ctaBandSub:
        "Try the feed and editor, and start on the free tier to explore Keyp. in your workflow.",
      ctaPrimary: "GET A DEMO",
      ctaSecondary: "SIGN UP FOR FREE",
      footerNav1: "ABOUT",
      footerNav2: "CONTACT",
      footerNav3: "EMAIL US",
      footerLegalStatus: "Status",
      footerLegalTerms: "Terms of Use",
      footerLegalPrivacy: "Privacy Policy",
    },
  };

  const c = content[lang];
  const ctaBandImageSrc =
    lang === "ko"
      ? theme === "light"
        ? "/kr-wt.png"
        : "/kr-dk.png"
      : theme === "light"
        ? "/en-wt.png"
        : "/en-dk.png";
  const trendHeadingColor = theme === "light" ? LIGHT_THEME_TREND_COLOR_2026 : CORE_COLOR_2026;
  const trendKeywordColor = theme === "light" ? LIGHT_THEME_TREND_COLOR_2026 : CORE_TEXT_COLOR_2026;
  const selectedTrendArticle =
    TREND_KEYWORD_BRIEFS.find((item) => item.keyword === selectedTrendKeyword) ?? TREND_KEYWORD_BRIEFS[0];
  const heroCtaPullOffset = Math.max(0, (heroCtaContainerWidth - heroCtaButtonWidth) / 2);
  const statsSectionRef = useRef<HTMLElement | null>(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const footerRevealRef = useRef<HTMLElement | null>(null);
  const [footerRevealHeight, setFooterRevealHeight] = useState(520);
  const [footerLogoLiftPx, setFooterLogoLiftPx] = useState(0);

  const footerRevealBg = theme === "light" ? "#ffffff" : "#0a0a0a";
  const mainCurtainBg = theme === "light" ? "#f1f0ec" : "#121212";
  const footerTextPrimary = theme === "light" ? "text-zinc-700" : "text-zinc-300";
  const footerTextMuted = theme === "light" ? "text-zinc-500" : "text-zinc-500";
  const footerBorder = theme === "light" ? "border-black/10" : "border-white/10";
  const footerHoverText = theme === "light" ? "hover:text-black" : "hover:text-white";
  const footerIconButtonClass =
    theme === "light"
      ? "border-black/15 text-zinc-700 hover:text-black hover:border-black/35"
      : "border-white/15 text-zinc-200 hover:text-primary hover:border-primary/60";

  /** Stable hit box (no CSS transform) — avoids feedback jitter when tilting the inner img. */
  const applyCtaBandTilt = (event: MouseEvent<HTMLDivElement>) => {
    const hit = event.currentTarget;
    const rect = hit.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    const rotateY = (relativeX - 0.5) * 8;
    const rotateX = (0.5 - relativeY) * 6;
    const tilt = ctaTiltRef.current;
    tilt.targetX = rotateX;
    tilt.targetY = rotateY;
    tilt.targetScale = 1.015;
  };

  const resetCtaBandTilt = () => {
    // Freeze at the pose just before mouse leaves.
    const tilt = ctaTiltRef.current;
    tilt.targetX = tilt.currentX;
    tilt.targetY = tilt.currentY;
    tilt.targetScale = tilt.currentScale;
  };

  useEffect(() => {
    const syncCtaWidths = () => {
      if (!heroCtaContainerRef.current || !heroCtaButtonRef.current) return;
      setHeroCtaContainerWidth(heroCtaContainerRef.current.offsetWidth);
      setHeroCtaButtonWidth(heroCtaButtonRef.current.offsetWidth);
    };

    syncCtaWidths();
    window.addEventListener("resize", syncCtaWidths);
    return () => window.removeEventListener("resize", syncCtaWidths);
  }, [c.cta, lang]);


  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.backgroundColor;
    const prevBodyBg = body.style.backgroundColor;

    html.style.backgroundColor = footerRevealBg;
    body.style.backgroundColor = footerRevealBg;

    return () => {
      html.style.backgroundColor = prevHtmlBg;
      body.style.backgroundColor = prevBodyBg;
    };
  }, [footerRevealBg]);

  useEffect(() => {
    const target = statsSectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsStatsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const imgEl = ctaBandImageRef.current;
    if (!imgEl) return;

    let raf = 0;
    /** More page scroll → larger scale (not tied to element proximity). */
    const updateCtaImageScrollScale = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        imgEl.style.setProperty("--scroll-scale", "1");
        return;
      }

      const scrollY = window.scrollY ?? document.documentElement.scrollTop ?? 0;
      const scrollPxToMax = 640;
      const t = Math.max(0, Math.min(1, scrollY / scrollPxToMax));
      const eased = 1 - (1 - t) ** 1.85;
      const minScale = 0.86;
      const maxScale = 0.99;
      const scale = minScale + (maxScale - minScale) * eased;
      imgEl.style.setProperty("--scroll-scale", String(scale));
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateCtaImageScrollScale);
    };

    updateCtaImageScrollScale();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [ctaBandImageSrc, lang, theme]);

  useEffect(() => {
    const imgEl = ctaBandImageRef.current;
    if (!imgEl) return;

    let raf = 0;
    const animateTilt = () => {
      const tilt = ctaTiltRef.current;
      const lerp = 0.14;

      tilt.currentX += (tilt.targetX - tilt.currentX) * lerp;
      tilt.currentY += (tilt.targetY - tilt.currentY) * lerp;
      tilt.currentScale += (tilt.targetScale - tilt.currentScale) * lerp;

      imgEl.style.setProperty("--tilt-x", `${tilt.currentX.toFixed(3)}deg`);
      imgEl.style.setProperty("--tilt-y", `${tilt.currentY.toFixed(3)}deg`);
      imgEl.style.setProperty("--tilt-scale", String(Number(tilt.currentScale.toFixed(4))));

      raf = requestAnimationFrame(animateTilt);
    };

    raf = requestAnimationFrame(animateTilt);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const el = footerRevealRef.current;
    if (!el) return;
    const sync = () => {
      setFooterRevealHeight(Math.ceil(el.getBoundingClientRect().height));
    };
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync();
    return () => ro.disconnect();
  }, [lang, theme]);

  useEffect(() => {
    let raf = 0;
    const run = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setFooterLogoLiftPx(0);
        return;
      }
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const t = (window.scrollY ?? 0) / maxScroll;
      const zone = Math.max(0, Math.min(1, (t - 0.62) / 0.38));
      setFooterLogoLiftPx((1 - zone) * 24);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(run);
    };
    run();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [footerRevealHeight]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const normalizeDeltaY = (event: WheelEvent) => {
      if (event.deltaMode === 1) return event.deltaY * 16;
      if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
      return event.deltaY;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      if (Math.abs(event.deltaY) < 0.5) return;

      const footerEl = footerRevealRef.current;
      if (footerEl && event.target instanceof Node && footerEl.contains(event.target)) {
        return;
      }

      event.preventDefault();
      const slowFactor = 0.28;
      const nextDelta = normalizeDeltaY(event) * slowFactor;
      window.scrollBy({ top: nextDelta, left: 0, behavior: "auto" });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <>
      {/* Fixed layer behind main — revealed when main curtain scrolls up */}
      <footer
        ref={footerRevealRef}
        className="fixed bottom-0 left-0 right-0 z-0 flex min-h-[56vh] md:min-h-[62vh] flex-col justify-end pt-6 md:pt-8 text-zinc-300"
        style={{ backgroundColor: footerRevealBg }}
      >
        {/* Sitemap footer block */}
        <div className="relative z-20 pointer-events-none max-w-6xl mx-auto w-full px-6 pt-14 md:pt-10">
          <div className={`keyp-footer-primary pointer-events-auto border-b ${footerBorder} pb-8 md:pb-10`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8 md:gap-x-10">
              <div>
                <p className={`font-mono text-[11px] uppercase tracking-[0.16em] ${footerTextMuted} mb-3`}>
                  Product
                </p>
                <div className="space-y-1">
                  <button
                    type="button"
                    className={`block py-2 text-sm md:text-base leading-6 transition-all underline-offset-4 hover:underline ${footerTextPrimary} ${footerHoverText}`}
                    onClick={() => toast(lang === "ko" ? "소개 — 준비 중입니다" : "About — coming soon")}
                  >
                    {c.footerNav1}
                  </button>
                  <button
                    type="button"
                    className={`block py-2 text-sm md:text-base leading-6 transition-all underline-offset-4 hover:underline ${footerTextPrimary} ${footerHoverText}`}
                    onClick={() => toast(lang === "ko" ? "기능 소개 — 준비 중입니다" : "Features — coming soon")}
                  >
                    {lang === "ko" ? "기능" : "Features"}
                  </button>
                  <Link href="/feed">
                    <span className={`inline-flex cursor-pointer py-2 text-sm md:text-base leading-6 transition-all underline-offset-4 hover:underline ${footerTextPrimary} ${footerHoverText}`}>
                      {lang === "ko" ? "플랫폼 입장" : "Enter Platform"}
                    </span>
                  </Link>
                </div>
              </div>

              <div>
                <p className={`font-mono text-[11px] uppercase tracking-[0.16em] ${footerTextMuted} mb-3`}>
                  Support
                </p>
                <div className="space-y-1">
                  <button
                    type="button"
                    className={`block py-2 text-sm md:text-base leading-6 transition-all underline-offset-4 hover:underline ${footerTextPrimary} ${footerHoverText}`}
                    onClick={() => toast(lang === "ko" ? "문의 — 준비 중입니다" : "Contact — coming soon")}
                  >
                    {c.footerNav2}
                  </button>
                  <a
                    href="mailto:hello@keyp.app"
                    className={`inline-flex py-2 text-sm md:text-base leading-6 transition-all underline-offset-4 hover:underline ${footerTextPrimary} ${footerHoverText}`}
                  >
                    {c.footerNav3}
                  </a>
                  <button
                    type="button"
                    className={`block py-2 text-sm md:text-base leading-6 transition-all underline-offset-4 hover:underline ${footerTextPrimary} ${footerHoverText}`}
                    onClick={() => toast(lang === "ko" ? "상태 — 준비 중입니다" : "Status — coming soon")}
                  >
                    {c.footerLegalStatus}
                  </button>
                </div>
              </div>

              <div>
                <p className={`font-mono text-[11px] uppercase tracking-[0.16em] ${footerTextMuted} mb-3`}>
                  Legal
                </p>
                <div className="space-y-1">
                  <button
                    type="button"
                    className={`block py-2 text-sm md:text-base leading-6 transition-all underline-offset-4 hover:underline ${footerTextPrimary} ${footerHoverText}`}
                    onClick={() => toast(lang === "ko" ? "이용약관 — 준비 중입니다" : "Terms — coming soon")}
                  >
                    {c.footerLegalTerms}
                  </button>
                  <button
                    type="button"
                    className={`block py-2 text-sm md:text-base leading-6 transition-all underline-offset-4 hover:underline ${footerTextPrimary} ${footerHoverText}`}
                    onClick={() => toast(lang === "ko" ? "개인정보 — 준비 중입니다" : "Privacy — coming soon")}
                  >
                    {c.footerLegalPrivacy}
                  </button>
                </div>
              </div>

              <div>
                <p className={`font-mono text-[11px] uppercase tracking-[0.16em] ${footerTextMuted} mb-3`}>
                  Social
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="https://github.com/pistolinkr/keyp."
                    target="_blank"
                    rel="noreferrer"
                    className={`h-10 min-w-10 px-3 inline-flex items-center justify-center gap-1 border transition-all ${footerIconButtonClass}`}
                    aria-label="GitHub"
                  >
                    <Github size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href="mailto:hello@keyp.app"
                    className={`h-10 min-w-10 px-3 inline-flex items-center justify-center gap-1 border transition-all ${footerIconButtonClass}`}
                    aria-label="Email"
                  >
                    <Mail size={16} strokeWidth={1.75} />
                  </a>
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className={`h-10 px-3 inline-flex items-center justify-center gap-1 border transition-all ${footerIconButtonClass}`}
                  >
                    <ArrowUp size={16} strokeWidth={1.75} />
                    <span className="font-mono text-xs">{lang === "ko" ? "맨위" : "TOP"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 거대 로고 컨테이너 */}
        <div className="keyp-footer-logo relative z-0 pointer-events-none max-w-6xl mx-auto w-full px-6 pt-8 md:pt-10 pb-10 md:pb-12">
          <div
            className="will-change-transform flex justify-center"
            style={{
              transform: `translateY(${footerLogoLiftPx}px)`,
              transition: "transform 0.12s ease-out",
            }}
          >
            <p
              className="font-black text-primary leading-[0.82] select-none whitespace-nowrap text-center"
              style={{
                fontFamily:
                  lang === "ko"
                    ? "Noto Sans, Noto Sans KR, Apple SD Gothic Neo, system-ui, sans-serif"
                    : "Noto Sans KR, system-ui, sans-serif",
                letterSpacing: lang === "ko" ? "-0.01em" : "-0.06em",
                fontSize: lang === "ko" ? "clamp(4.4rem, 39vw, 29rem)" : "clamp(3.5rem, 36vw, 26rem)",
                transform: lang === "ko" ? "scaleX(0.9) translateY(0.14em)" : undefined,
                transformOrigin: "center center",
              }}
            >
              {lang === "ko" ? <>ㅋ<span className="keyp-ko-i-glyph">I</span>ㅂ.</> : "Keyp."}
            </p>
          </div>
        </div>

        {/* Bottom bar: pinned to footer section very bottom */}
        <div className={`keyp-footer-legal w-full px-[0.7rem] pointer-events-auto py-4 text-xs font-mono flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${footerTextMuted}`}>
          <p className="px-0">
            {`Copyright © ${new Date().getFullYear()} Keyp. Production Line.31 served by g.gear service delta team for pistolinkr`}
          </p>
          <div className="flex flex-wrap justify-end gap-x-6 gap-y-1">
            <button
              type="button"
              className={`transition-colors underline-offset-4 hover:underline ${footerHoverText}`}
              onClick={() => toast(lang === "ko" ? "이용약관 — 준비 중입니다" : "Terms — coming soon")}
            >
              {c.footerLegalTerms}
            </button>
            <button
              type="button"
              className={`transition-colors underline-offset-4 hover:underline ${footerHoverText}`}
              onClick={() => toast(lang === "ko" ? "개인정보 — 준비 중입니다" : "Privacy — coming soon")}
            >
              {c.footerLegalPrivacy}
            </button>
          </div>
        </div>
      </footer>

      {/* Main curtain — higher z-index, opaque theme bg, bottom margin = footer height */}
      <div
        className="relative z-10 min-h-screen text-foreground shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        style={{
          backgroundColor: mainCurtainBg,
          marginBottom: footerRevealHeight,
        }}
      >
      {/* ─── LANDING HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[4.5rem] border-b border-border keyp-navbar">
        <div className="max-w-6xl mx-auto w-full h-full px-6 flex items-center gap-4">
          <div className="flex items-center">
            <img src="/logo.png" alt="Keyp. logo" className="h-9 w-auto object-contain" />
          </div>

          <div className="flex-1" />

          <div className="keyp-lang-toggle keyp-header-control !h-9">
            <button className={lang === 'ko' ? 'active' : ''} onClick={() => setLang('ko')}>KO</button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          </div>

          <button className="keyp-header-control !h-9 w-9 hover:bg-accent transition-colors" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <Link href="/feed">
            <button className="keyp-btn-primary h-10 px-6 text-sm flex items-center gap-1.5">
              {lang === 'ko' ? '입장하기' : 'Enter'}
              <ArrowRight size={15} />
            </button>
          </Link>
        </div>
      </header>
      <NavbarScrollBlur />

      {/* ─── CTA BAND + FEATURE STRIP ─── */}
      <section className="pt-[4.5rem] bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-8 md:pt-24 md:pb-12">
          <div
            ref={ctaHeadlineRef}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 md:gap-12"
          >
            <div className="max-w-xl">
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground leading-[1.12]"
                style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}
              >
                {lang === 'ko' ? (
                  <>
                    일 년 동안 여기에{' '}
                    <span className="text-primary">'Keyp'</span>
                  </>
                ) : (
                  <>
                    <span className="text-primary">Keyp</span>
                    {' '}your post on here!
                  </>
                )}
              </h2>
              <p className="mt-5 text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
                {c.ctaBandSub}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
              <Link href="/feed" className="inline-flex">
                <button
                  type="button"
                  className="keyp-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold w-full sm:w-auto"
                >
                  {c.ctaPrimary}
                  <ArrowUpRight size={18} strokeWidth={2} />
                </button>
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold border border-border bg-muted text-foreground hover:bg-accent transition-colors w-full sm:w-auto"
                onClick={() => toast(lang === 'ko' ? '가입 — 준비 중입니다' : 'Sign up — coming soon')}
              >
                {c.ctaSecondary}
                <ArrowUpRight size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl xl:max-w-[96rem] mx-auto px-4 py-6 md:px-6 md:py-10 flex justify-center items-end min-h-[320px] md:min-h-[420px]">
          <div
            ref={ctaImageWrapRef}
            className="relative z-0 w-fit max-w-full overflow-hidden border-border bg-card p-4 md:p-6"
          >
            <div
              className="inline-block max-w-full select-none"
              onMouseMove={applyCtaBandTilt}
              onMouseLeave={resetCtaBandTilt}
            >
              <img
                ref={ctaBandImageRef}
                src={ctaBandImageSrc}
                alt=""
                className="pointer-events-none block h-auto w-auto max-w-full rounded-[20px] border-[0.7px] border-border keyp-tilt-image keyp-landing-cta-scroll"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section ref={statsSectionRef} className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-0">
          {c.stats.map((stat, i) => (
            <LandingStatCard key={stat.label} stat={stat as LandingStat} index={i} isVisible={isStatsVisible} />
          ))}
        </div>
      </section>

      {/* ─── 2026 TREND SPECIAL ─── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="mb-10">
          <p className="keyp-section-label mb-3" style={{ color: trendHeadingColor }}>{c.trendSectionLabel}</p>
          <h2
            className="text-3xl md:text-4xl font-black text-foreground mb-4"
            style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.03em' }}
          >
            {lang === "ko" ? (
              <>
                2026 <span className="text-primary">한국</span> 트렌드 키워드
              </>
            ) : (
              c.trendTitle
            )}
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            {lang === "ko" ? (
              <>
                <span className="text-primary">한국</span>
                의 시장, 정책, 생활 변화에서 출발한 2026 핵심 키워드를 빠르게 파악합니다.
              </>
            ) : (
              <>
                Track 2026 signals rooted in <span className="text-primary">Korean</span> market shifts, policy changes, and daily life.
              </>
            )}
          </p>
        </div>

        <div
          className="border bg-card p-6 md:p-8 mb-8"
          style={{ borderColor: "rgba(245, 220, 74, 0.45)" }}
        >
          <div className="flex flex-wrap gap-2.5">
            {TREND_KEYWORD_BRIEFS.map((item) => (
              <button
                key={item.keyword}
                type="button"
                onClick={() => setSelectedTrendKeyword(item.keyword)}
                className={`relative z-20 px-3 py-1.5 border text-lg md:text-2xl font-black tracking-tight transition-all duration-200 ${
                  selectedTrendKeyword === item.keyword
                    ? "scale-[1.02] shadow-sm"
                    : "hover:-translate-y-0.5"
                }`}
                style={{
                  fontFamily: 'Noto Sans KR',
                  letterSpacing: '-0.02em',
                  borderColor: "rgba(245, 220, 74, 0.45)",
                  backgroundColor:
                    selectedTrendKeyword === item.keyword
                      ? "rgba(245, 220, 74, 0.26)"
                      : "rgba(245, 220, 74, 0.14)",
                  color: trendKeywordColor,
                }}
              >
                {lang === "ko" ? item.keyword : item.keywordEn}
              </button>
            ))}
          </div>
        </div>

        <div className="border-l border-t border-border">
          <article
            key={selectedTrendArticle.keyword}
            className="border-r border-b border-border p-6 md:p-7 transition-all duration-300 ease-out hover:bg-accent/40"
          >
            <div className="animate-fade-in-up" key={selectedTrendArticle.keyword}>
              <h3
                className="text-2xl md:text-3xl font-black mb-3 text-foreground transition-colors"
                style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.03em', color: trendHeadingColor }}
              >
                {lang === "ko" ? selectedTrendArticle.keyword : selectedTrendArticle.keywordEn}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {lang === "ko" ? selectedTrendArticle.summaryKo : selectedTrendArticle.summaryEn}
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="keyp-section-label mb-3">PLATFORM FEATURES</p>
          <h2
            className="text-3xl md:text-4xl font-black text-foreground"
            style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.03em' }}
          >
            {lang === 'ko' ? (
              <>
                이것으로{' '}
                <span className="text-primary">Keyp</span>
                하는 방법과 이유?
              </>
            ) : (
              <>
                How to <span className="text-primary">Keyp</span> with this and why?
              </>
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-border">
          {c.features.map((feature, i) => (
            <div
              key={i}
              className="border-r border-b border-border p-8 hover:bg-accent/50 transition-colors group animate-fade-in-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="w-10 h-10 border border-border flex items-center justify-center mb-5 group-hover:border-primary group-hover:text-primary transition-colors">
                <feature.icon size={18} strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'Noto Sans KR' }}>
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden">
        {/* Hero image */}
        <div className="relative h-[480px] md:h-[560px] overflow-hidden">
          {/* Hero text */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-6xl mx-auto w-full px-6">
              <div className="max-w-2xl">
                <div className="flex items-center mb-6">
                  <span className="keyp-section-label">KOREA CONTEXT FIRST</span>
                </div>

                <h1
                  className="text-4xl md:text-6xl font-black leading-none mb-6 text-foreground"
                  style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}
                >
                  {lang === 'ko' ? (
                    <>
                      <span className="text-primary">한국</span>
                      의 맥락으로 읽고, 세계와 연결된다
                    </>
                  ) : (
                    <>
                      Read <span className="text-primary">Korea</span> in context, connect to the world
                    </>
                  )}
                </h1>

                <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg whitespace-pre-line">
                  {c.subtitle}
                </p>

                <div
                  ref={heroCtaContainerRef}
                  className="relative inline-flex items-stretch h-12 overflow-hidden"
                  onMouseEnter={() => setIsHeroCtaHovered(true)}
                  onMouseLeave={() => setIsHeroCtaHovered(false)}
                >
                  <Link href="/feed" className="relative z-20">
                    <button
                      ref={heroCtaButtonRef}
                      className="keyp-btn-primary flex items-center justify-center text-[19px] px-6 py-0 h-12 bg-transparent"
                    >
                      <span
                        className="flex items-center gap-2 transition-transform duration-300 ease-out"
                        style={{
                          transform: `translateX(${isHeroCtaHovered ? heroCtaPullOffset : 0}px)`,
                        }}
                      >
                        {c.cta}
                        <ArrowRight size={16} />
                      </span>
                    </button>
                  </Link>
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${isHeroCtaHovered ? heroCtaContainerWidth : heroCtaButtonWidth}px` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
