/*
 * KEYP. LANDING PAGE
 * Design: Sharp Editorial Intelligence
 * Hero section with geometric banner, platform intro, CTA
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sun,
  Moon,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  MessageSquare,
  Globe,
  Zap,
  Users,
  TrendingUp,
  Github,
} from "lucide-react";
import { currentSeason } from "@/lib/mockData";
import { toast } from "sonner";

const HERO_BANNER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663440167945/Jji6NfGi9ZRd2BD8ESyw5F/keyp-hero-banner-CgBiVkSAWxcq7r6YNShYJd.webp";
const CORE_COLOR_2026 = "rgb(245, 220, 74)";
const CORE_TEXT_COLOR_2026 = "rgb(196, 164, 30)";
const LIGHT_THEME_TREND_COLOR_2026 = "#e9a91f";
const TREND_ARTICLES_2026 = [
  {
    keyword: "휴먼인더루프",
    keywordEn: "Human-in-the-Loop",
    summaryKo: "AI가 초안을 만들고 인간이 맥락을 최종 판단하는 협업 모델이 표준이 됩니다. 의사결정의 속도는 높아지되, 책임과 검증은 사람 중심으로 재정렬됩니다.",
    summaryEn: "AI drafts while humans make final contextual decisions. Organizations move faster, but accountability and validation remain human-centered.",
  },
  {
    keyword: "필코노미",
    keywordEn: "Philconomy",
    summaryKo: "결핍을 단순한 문제로 보지 않고 정체성과 소비를 형성하는 문화 코드로 해석하는 흐름입니다. 브랜드는 '무엇을 채워주나'보다 '왜 부족함을 느끼나'를 다루게 됩니다.",
    summaryEn: "Scarcity becomes a cultural code shaping identity and spending. Brands shift from filling needs to understanding why people feel lacking.",
  },
  {
    keyword: "제로클릭",
    keywordEn: "Zero-Click",
    summaryKo: "사용자가 클릭하기 전에 정보가 소비되는 인터페이스가 확산됩니다. 검색과 콘텐츠는 체류보다 즉시 이해를 제공하는 구조로 재편됩니다.",
    summaryEn: "Information is consumed before users click. Search and content ecosystems optimize for instant comprehension over page dwell time.",
  },
  {
    keyword: "레디코어",
    keywordEn: "Ready-Core",
    summaryKo: "준비된 상태 자체가 경쟁력이 되는 시대입니다. 개인과 조직은 실행 속도보다 사전 세팅, 템플릿, 운영 자동화 역량으로 차이를 만듭니다.",
    summaryEn: "Readiness itself becomes the edge. Teams compete through preconfigured systems, templates, and operational automation.",
  },
  {
    keyword: "AX조직",
    keywordEn: "AX Organization",
    summaryKo: "AI 전환은 도구 도입이 아니라 조직 구조의 재설계 문제로 이동합니다. 직무 경계가 유연해지고, 팀은 AI를 전제로 역할을 다시 정의합니다.",
    summaryEn: "AI transformation shifts from tools to org redesign. Role boundaries blur and teams redefine responsibilities with AI as a baseline.",
  },
  {
    keyword: "픽셀라이프",
    keywordEn: "Pixel Life",
    summaryKo: "오프라인 경험조차 디지털 레이어를 통해 기록, 공유, 평가되는 생활 방식이 일상화됩니다. 삶의 단위가 '장면'과 '데이터'로 동시 관리됩니다.",
    summaryEn: "Even offline experiences are logged, shared, and evaluated through digital layers. Life is managed as both moments and data.",
  },
  {
    keyword: "프라이스 디코딩",
    keywordEn: "Price Decoding",
    summaryKo: "소비자는 가격표가 아닌 가격의 구조를 읽기 시작합니다. 구독, 번들, 동적 요금제의 논리를 해석하는 능력이 구매 전략이 됩니다.",
    summaryEn: "Consumers decode pricing logic, not just tags. Interpreting subscriptions, bundles, and dynamic rates becomes a core buying skill.",
  },
  {
    keyword: "건강지능 HQ",
    keywordEn: "Health Intelligence HQ",
    summaryKo: "건강 관리의 중심이 병원 단일 접점에서 개인 데이터 허브로 이동합니다. 수면, 식습관, 스트레스 데이터가 생활 의사결정의 기본 입력값이 됩니다.",
    summaryEn: "Health management moves from hospital touchpoints to personal data hubs. Sleep, diet, and stress metrics become daily decision inputs.",
  },
  {
    keyword: "1.5가구",
    keywordEn: "1.5 Household",
    summaryKo: "1인 가구와 가족 가구의 중간 형태가 새로운 소비 단위로 부상합니다. 함께 살지 않아도 함께 소비하는 관계 기반 생활권이 확대됩니다.",
    summaryEn: "A new unit between solo and family households emerges. People consume together without necessarily living together.",
  },
  {
    keyword: "근본이즘",
    keywordEn: "Back-to-Basics",
    summaryKo: "과잉 정보 시대에 기본기와 본질로 회귀하려는 흐름이 강해집니다. 제품과 콘텐츠는 화려함보다 신뢰 가능한 핵심 가치로 평가받습니다.",
    summaryEn: "In an age of overload, people return to fundamentals. Products and content are judged more by trustworthy core value than novelty.",
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const [selectedTrendKeyword, setSelectedTrendKeyword] = useState<string>(TREND_ARTICLES_2026[0]?.keyword ?? "");
  const [isHeroBadgeVisible, setIsHeroBadgeVisible] = useState(true);
  const [navBadgeTransitionMs, setNavBadgeTransitionMs] = useState(220);
  const [isHeroCtaHovered, setIsHeroCtaHovered] = useState(false);
  const [heroCtaButtonWidth, setHeroCtaButtonWidth] = useState(0);
  const [heroCtaContainerWidth, setHeroCtaContainerWidth] = useState(0);
  const heroBadgeRef = useRef<HTMLSpanElement | null>(null);
  const heroCtaContainerRef = useRef<HTMLDivElement | null>(null);
  const heroCtaButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const currentDurationRef = useRef(220);
  const rafRef = useRef<number | null>(null);

  const content = {
    ko: {
      tagline: '지식은 공유될 때 완성된다',
      subtitle: 'Keyp.는 한국인과 세계를 연결하는 교육형 지식 커뮤니티입니다.\nMedium의 깊이 있는 읽기 경험과 Reddit의 구조적 토론을 결합했습니다.',
      cta: '입장하기',
      trendSectionLabel: "2026 트렌드 스페셜",
      trendTitle: "2026 트렌드 리포트",
      trendSubtitle: "트렌드 코리아 2026 도서에서 볼 수 있는 2026년의 트렌드 키워드입니다.",
      features: [
        { icon: BookOpen, title: '깊이 있는 글쓰기', desc: '시즌제로 운영되는 지식 아카이브. 매년 새롭게 시작하는 지식의 여정.' },
        { icon: MessageSquare, title: '구조적 토론', desc: 'Reddit 스타일의 재귀적 댓글 스레드. 복잡한 논의도 명확하게 추적.' },
        { icon: Globe, title: '이중 언어 지원', desc: '모든 글을 한국어와 영어로. 언어의 장벽 없이 지식을 나눕니다.' },
        { icon: Zap, title: 'AI 글쓰기 보조', desc: '비침습적 AI 어시스턴트. 당신의 글쓰기를 방해하지 않고 도와드립니다.' },
        { icon: Users, title: '지식 커뮤니티', desc: '검증된 전문가와 열정적인 학습자가 함께하는 교육 생태계.' },
        { icon: TrendingUp, title: '시즌 랭킹', desc: '연간 리셋되는 공정한 경쟁. 매 시즌 새로운 기회가 열립니다.' },
      ],
      stats: [
        { value: '12,847', label: '활성 사용자' },
        { value: '648', label: '시즌 게시글' },
        { value: '3', label: '운영 시즌' },
        { value: String(currentSeason.episodeCount), label: '이번 주 에피소드' },
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
      tagline: 'Knowledge is complete when shared',
      subtitle: "Keyp. is an educational knowledge community connecting Koreans and the world.\nCombining Medium's deep reading experience with Reddit's structured discussion.",
      cta: 'Get Started',
      trendSectionLabel: "2026 TREND SPECIAL",
      trendTitle: "2026 Trend Report",
      trendSubtitle: "Trend keywords for 2026 as featured in the Trend Korea 2026 book.",
      features: [
        { icon: BookOpen, title: 'Deep Writing', desc: 'A season-based knowledge archive. A new journey of knowledge beginning each year.' },
        { icon: MessageSquare, title: 'Structured Discussion', desc: 'Reddit-style recursive comment threads. Track complex discussions clearly.' },
        { icon: Globe, title: 'Bilingual Support', desc: 'Every post in Korean and English. Share knowledge without language barriers.' },
        { icon: Zap, title: 'AI Writing Assistant', desc: 'Non-invasive AI assistant. Helps your writing without getting in the way.' },
        { icon: Users, title: 'Knowledge Community', desc: 'An educational ecosystem where verified experts and passionate learners meet.' },
        { icon: TrendingUp, title: 'Season Rankings', desc: 'Fair competition with annual resets. New opportunities open each season.' },
      ],
      stats: [
        { value: '12,847', label: 'Active Users' },
        { value: '648', label: 'Season Posts' },
        { value: '3', label: 'Seasons Run' },
        { value: String(currentSeason.episodeCount), label: 'This Week\'s Episodes' },
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
    TREND_ARTICLES_2026.find((item) => item.keyword === selectedTrendKeyword) ?? TREND_ARTICLES_2026[0];
  const showHeaderSeasonBadge = !isHeroBadgeVisible;
  const heroCtaPullOffset = Math.max(0, (heroCtaContainerWidth - heroCtaButtonWidth) / 2);

  useEffect(() => {
    const target = heroBadgeRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroBadgeVisible(entry.isIntersecting && entry.intersectionRatio > 0.15);
      },
      {
        threshold: [0, 0.15, 0.35, 0.65, 1],
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    lastScrollTimeRef.current = performance.now();

    const syncDurationByScrollSpeed = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(now - lastScrollTimeRef.current, 1);
      const dy = Math.abs(y - lastScrollYRef.current);
      const velocityPxPerSec = (dy / dt) * 1000;

      // Faster scroll => faster badge transition.
      const mapped = Math.round(360 - Math.min(velocityPxPerSec, 3000) * 0.08);
      const nextDuration = Math.max(110, Math.min(360, mapped));

      if (Math.abs(nextDuration - currentDurationRef.current) >= 18) {
        currentDurationRef.current = nextDuration;
        setNavBadgeTransitionMs(nextDuration);
      }

      lastScrollYRef.current = y;
      lastScrollTimeRef.current = now;
      rafRef.current = null;
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(syncDurationByScrollSpeed);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const syncCtaWidths = () => {
      if (!heroCtaContainerRef.current || !heroCtaButtonRef.current) return;
      setHeroCtaContainerWidth(heroCtaContainerRef.current.offsetWidth);
      setHeroCtaButtonWidth(heroCtaButtonRef.current.offsetWidth);
    };

    syncCtaWidths();
    window.addEventListener("resize", syncCtaWidths);
    return () => window.removeEventListener("resize", syncCtaWidths);
  }, [c.cta, currentSeason.label, lang]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── LANDING HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background">
        <div className="max-w-6xl mx-auto w-full h-full px-6 flex items-center gap-4">
          <div className="flex items-center">
            <img src="/logo.png" alt="Keyp. logo" className="h-7 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-1.5 ml-5">
            <span
              className={`keyp-season-badge keyp-season-badge-header transition-all ease-out ${
                showHeaderSeasonBadge
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3 pointer-events-none"
              }`}
              style={{ transitionDuration: `${navBadgeTransitionMs}ms` }}
            >
              {currentSeason.label} · ACTIVE
            </span>
          </div>

          <div className="flex-1" />

          <div className="keyp-lang-toggle keyp-header-control">
            <button className={lang === 'ko' ? 'active' : ''} onClick={() => setLang('ko')}>KO</button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          </div>

          <button className="keyp-header-control w-8 hover:bg-accent transition-colors" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          <Link href="/feed">
            <button className="keyp-btn-primary h-8 px-5 flex items-center gap-1.5">
              {lang === 'ko' ? '입장하기' : 'Enter'}
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="pt-14 relative overflow-hidden">
        {/* Hero image */}
        <div className="relative h-[480px] md:h-[560px] overflow-hidden">
          <img
            src={HERO_BANNER}
            alt="Keyp. Platform"
            className="w-full h-full object-cover"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />

          {/* Hero text */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-6xl mx-auto w-full px-6">
              <div className="max-w-2xl">
                <div className="flex items-center mb-6">
                  <span className="keyp-section-label">KNOWLEDGE COMMUNITY</span>
                </div>

                <h1
                  className="text-4xl md:text-6xl font-black leading-none mb-6 text-foreground"
                  style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}
                >
                  {c.tagline}
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
                  <span ref={heroBadgeRef} className="keyp-season-badge text-xs h-12 -ml-px pr-6 relative z-0">{currentSeason.label} · ACTIVE</span>
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

      {/* ─── STATS BAR ─── */}
      <section className="border-y border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-0">
          {c.stats.map((stat, i) => (
            <div
              key={i}
              className={`px-6 py-4 ${i < c.stats.length - 1 ? 'border-r border-border' : ''} animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="font-black text-3xl text-foreground mb-1" style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}>
                {stat.value}
              </div>
              <div className="keyp-section-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 2026 TREND SPECIAL ─── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-10">
          <p className="keyp-section-label mb-3" style={{ color: trendHeadingColor }}>{c.trendSectionLabel}</p>
          <h2
            className="text-3xl md:text-4xl font-black text-foreground mb-4"
            style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.03em' }}
          >
            {c.trendTitle}
          </h2>
          <p className="text-muted-foreground max-w-3xl">{c.trendSubtitle}</p>
        </div>

        <div
          className="border bg-card p-6 md:p-8 mb-8"
          style={{ borderColor: "rgba(245, 220, 74, 0.45)" }}
        >
          <div className="flex flex-wrap gap-2.5">
            {TREND_ARTICLES_2026.map((item) => (
              <button
                key={item.keyword}
                type="button"
                onClick={() => setSelectedTrendKeyword(item.keyword)}
                className={`px-3 py-1.5 border text-lg md:text-2xl font-black tracking-tight transition-all duration-200 ${
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
            {lang === 'ko' ? '왜 Keyp.인가?' : 'Why Keyp.?'}
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

      {/* ─── SEASON SYSTEM ─── */}
      <section className="border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 flex flex-col justify-center">
            <p className="keyp-section-label mb-3">SEASON SYSTEM</p>
            <h2
              className="text-3xl font-black mb-4 text-foreground"
              style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.03em' }}
            >
              {lang === 'ko' ? '매년 새롭게 시작하는\n지식의 시즌' : 'A New Season of\nKnowledge Every Year'}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
              {lang === 'ko'
                ? '시즌제는 단순한 필터가 아닙니다. 매년 1월 1일 새로운 시즌이 시작되며, 과거 시즌의 글은 읽기 전용 아카이브로 보존됩니다. 공정한 경쟁, 새로운 기회.'
                : 'The season system is more than a filter. A new season begins every January 1st, and posts from past seasons are preserved as read-only archives. Fair competition, new opportunities.'}
            </p>
          </div>

          <div className="flex-1 flex justify-end">
            <div className="w-full max-w-sm border border-border bg-card p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="keyp-section-label">CURRENT SEASON</span>
                <span className="keyp-season-badge">LIVE</span>
              </div>
              <div
                className="text-5xl font-black mb-2 text-foreground"
                style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}
              >
                {currentSeason.label}
              </div>
              <div className="font-mono text-sm text-muted-foreground mb-4">
                2026.01.01 → ONGOING
              </div>
              <div className="keyp-divider mb-4" />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="font-bold text-xl">{currentSeason.episodeCount}</div>
                  <div className="font-mono text-xs text-muted-foreground">EPISODES</div>
                </div>
                <div>
                  <div className="font-bold text-xl">1.2K</div>
                  <div className="font-mono text-xs text-muted-foreground">MEMBERS</div>
                </div>
                <div>
                  <div className="font-bold text-xl">89%</div>
                  <div className="font-mono text-xs text-muted-foreground">ACTIVE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BAND + FEATURE STRIP ─── */}
      <section className="bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 md:gap-12">
            <div className="max-w-xl">
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground leading-[1.12]"
                style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}
              >
                {lang === 'ko' ? (
                  <>
                    몇 <span className="text-primary">분</span> 만에
                    <br />
                    시작하세요
                  </>
                ) : (
                  <>
                    Get started in{' '}
                    <span className="text-primary">minutes</span>
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

        <div className="max-w-6xl mx-auto px-6 pb-0">
          <div className="w-full aspect-[21/7] md:aspect-[24/7] overflow-hidden border-y border-border bg-muted">
            <img
              src={ctaBandImageSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center shrink-0">
              <img src="/logo.png" alt="Keyp." className="h-6 w-auto object-contain" />
            </Link>
            <nav className="flex flex-wrap justify-center md:justify-center gap-x-8 gap-y-2 md:gap-10">
              <button
                type="button"
                className="keyp-section-label hover:text-foreground transition-colors"
                onClick={() => toast(lang === 'ko' ? '소개 — 준비 중입니다' : 'About — coming soon')}
              >
                {c.footerNav1}
              </button>
              <button
                type="button"
                className="keyp-section-label hover:text-foreground transition-colors"
                onClick={() => toast(lang === 'ko' ? '문의 — 준비 중입니다' : 'Contact — coming soon')}
              >
                {c.footerNav2}
              </button>
              <a
                href="mailto:hello@keyp.app"
                className="keyp-section-label hover:text-foreground transition-colors"
              >
                {c.footerNav3}
              </a>
            </nav>
            <div className="flex justify-center md:justify-end gap-4">
              <a
                href="https://github.com/pistolinkr/keyp."
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-primary transition-colors p-1"
                aria-label="GitHub"
              >
                <Github size={18} strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground font-mono">
            <p>
              {lang === 'ko'
                ? `© ${new Date().getFullYear()} Keyp.`
                : `Copyright © ${new Date().getFullYear()} Keyp.`}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <button
                type="button"
                className="hover:text-foreground transition-colors"
                onClick={() => toast(lang === 'ko' ? '상태 — 준비 중입니다' : 'Status — coming soon')}
              >
                {c.footerLegalStatus}
              </button>
              <button
                type="button"
                className="hover:text-foreground transition-colors"
                onClick={() => toast(lang === 'ko' ? '이용약관 — 준비 중입니다' : 'Terms — coming soon')}
              >
                {c.footerLegalTerms}
              </button>
              <button
                type="button"
                className="hover:text-foreground transition-colors"
                onClick={() => toast(lang === 'ko' ? '개인정보 — 준비 중입니다' : 'Privacy — coming soon')}
              >
                {c.footerLegalPrivacy}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
