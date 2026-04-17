/*
 * KEYP. LANDING PAGE
 * Design: Sharp Editorial Intelligence
 * Hero section with geometric banner, platform intro, CTA
 */
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sun, Moon, ArrowRight, BookOpen, MessageSquare, Globe, Zap, Users, TrendingUp } from "lucide-react";
import { currentSeason } from "@/lib/mockData";
import { toast } from "sonner";

const HERO_BANNER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663440167945/Jji6NfGi9ZRd2BD8ESyw5F/keyp-hero-banner-CgBiVkSAWxcq7r6YNShYJd.webp";
const CORE_COLOR_2026 = "rgb(245, 220, 74)";
const CORE_TEXT_COLOR_2026 = "rgb(196, 164, 30)";
const LIGHT_THEME_TREND_COLOR_2026 = "#e9a91f";
const TREND_KEYWORDS_2026 = [
  "휴먼인더루프",
  "필코노미",
  "제로클릭",
  "레디코어",
  "AX조직",
  "픽셀라이프",
  "프라이스 디코딩",
  "건강지능 HQ",
  "1.5가구",
  "근본이즘",
];

const TREND_ARTICLES_2026 = [
  {
    keyword: "휴먼인더루프",
    summaryKo: "AI가 초안을 만들고 인간이 맥락을 최종 판단하는 협업 모델이 표준이 됩니다. 의사결정의 속도는 높아지되, 책임과 검증은 사람 중심으로 재정렬됩니다.",
    summaryEn: "AI drafts while humans make final contextual decisions. Organizations move faster, but accountability and validation remain human-centered.",
  },
  {
    keyword: "필코노미",
    summaryKo: "결핍을 단순한 문제로 보지 않고 정체성과 소비를 형성하는 문화 코드로 해석하는 흐름입니다. 브랜드는 '무엇을 채워주나'보다 '왜 부족함을 느끼나'를 다루게 됩니다.",
    summaryEn: "Scarcity becomes a cultural code shaping identity and spending. Brands shift from filling needs to understanding why people feel lacking.",
  },
  {
    keyword: "제로클릭",
    summaryKo: "사용자가 클릭하기 전에 정보가 소비되는 인터페이스가 확산됩니다. 검색과 콘텐츠는 체류보다 즉시 이해를 제공하는 구조로 재편됩니다.",
    summaryEn: "Information is consumed before users click. Search and content ecosystems optimize for instant comprehension over page dwell time.",
  },
  {
    keyword: "레디코어",
    summaryKo: "준비된 상태 자체가 경쟁력이 되는 시대입니다. 개인과 조직은 실행 속도보다 사전 세팅, 템플릿, 운영 자동화 역량으로 차이를 만듭니다.",
    summaryEn: "Readiness itself becomes the edge. Teams compete through preconfigured systems, templates, and operational automation.",
  },
  {
    keyword: "AX조직",
    summaryKo: "AI 전환은 도구 도입이 아니라 조직 구조의 재설계 문제로 이동합니다. 직무 경계가 유연해지고, 팀은 AI를 전제로 역할을 다시 정의합니다.",
    summaryEn: "AI transformation shifts from tools to org redesign. Role boundaries blur and teams redefine responsibilities with AI as a baseline.",
  },
  {
    keyword: "픽셀라이프",
    summaryKo: "오프라인 경험조차 디지털 레이어를 통해 기록, 공유, 평가되는 생활 방식이 일상화됩니다. 삶의 단위가 '장면'과 '데이터'로 동시 관리됩니다.",
    summaryEn: "Even offline experiences are logged, shared, and evaluated through digital layers. Life is managed as both moments and data.",
  },
  {
    keyword: "프라이스 디코딩",
    summaryKo: "소비자는 가격표가 아닌 가격의 구조를 읽기 시작합니다. 구독, 번들, 동적 요금제의 논리를 해석하는 능력이 구매 전략이 됩니다.",
    summaryEn: "Consumers decode pricing logic, not just tags. Interpreting subscriptions, bundles, and dynamic rates becomes a core buying skill.",
  },
  {
    keyword: "건강지능 HQ",
    summaryKo: "건강 관리의 중심이 병원 단일 접점에서 개인 데이터 허브로 이동합니다. 수면, 식습관, 스트레스 데이터가 생활 의사결정의 기본 입력값이 됩니다.",
    summaryEn: "Health management moves from hospital touchpoints to personal data hubs. Sleep, diet, and stress metrics become daily decision inputs.",
  },
  {
    keyword: "1.5가구",
    summaryKo: "1인 가구와 가족 가구의 중간 형태가 새로운 소비 단위로 부상합니다. 함께 살지 않아도 함께 소비하는 관계 기반 생활권이 확대됩니다.",
    summaryEn: "A new unit between solo and family households emerges. People consume together without necessarily living together.",
  },
  {
    keyword: "근본이즘",
    summaryKo: "과잉 정보 시대에 기본기와 본질로 회귀하려는 흐름이 강해집니다. 제품과 콘텐츠는 화려함보다 신뢰 가능한 핵심 가치로 평가받습니다.",
    summaryEn: "In an age of overload, people return to fundamentals. Products and content are judged more by trustworthy core value than novelty.",
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();

  const content = {
    ko: {
      tagline: '지식은 공유될 때 완성된다',
      subtitle: 'Keyp.는 한국인과 세계를 연결하는 교육형 지식 커뮤니티입니다.\nMedium의 깊이 있는 읽기 경험과 Reddit의 구조적 토론을 결합했습니다.',
      cta: '지금 시작하기',
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
    },
    en: {
      tagline: 'Knowledge is complete when shared',
      subtitle: "Keyp. is an educational knowledge community connecting Koreans and the world.\nCombining Medium's deep reading experience with Reddit's structured discussion.",
      cta: 'Get Started',
      trendTitle: "2026 Trend Report",
      trendSubtitle: "A static feature highlighting major shifts across technology, consumption, and organizational design.",
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
    },
  };

  const c = content[lang];
  const trendHeadingColor = theme === "light" ? LIGHT_THEME_TREND_COLOR_2026 : CORE_COLOR_2026;
  const trendKeywordColor = theme === "light" ? LIGHT_THEME_TREND_COLOR_2026 : CORE_TEXT_COLOR_2026;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── LANDING HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background">
        <div className="max-w-6xl mx-auto w-full h-full px-6 flex items-center gap-4">
          <div className="flex items-center">
            <img src="/logo.png" alt="Keyp. logo" className="h-7 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="keyp-season-badge keyp-season-badge-header">{currentSeason.label}</span>
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
                <div className="flex items-center gap-2 mb-6">
                  <span className="keyp-season-badge text-xs">{currentSeason.label} · ACTIVE</span>
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

                <div className="flex items-center gap-4">
                  <Link href="/feed">
                    <button className="keyp-btn-primary flex items-center gap-2 text-base px-6 py-3">
                      {c.cta}
                      <ArrowRight size={16} />
                    </button>
                  </Link>
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
          <p className="keyp-section-label mb-3" style={{ color: trendHeadingColor }}>2026 TREND SPECIAL</p>
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
            {TREND_KEYWORDS_2026.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1.5 border text-lg md:text-2xl font-black tracking-tight"
                style={{
                  fontFamily: 'Noto Sans KR',
                  letterSpacing: '-0.02em',
                  borderColor: "rgba(245, 220, 74, 0.45)",
                  backgroundColor: "rgba(245, 220, 74, 0.14)",
                  color: trendKeywordColor,
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-t border-border">
          {TREND_ARTICLES_2026.map((item) => (
            <article key={item.keyword} className="border-r border-b border-border p-6 md:p-7">
              <h3
                className="text-2xl md:text-3xl font-black mb-3 text-foreground"
                style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.03em', color: trendHeadingColor }}
              >
                {item.keyword}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {lang === "ko" ? item.summaryKo : item.summaryEn}
              </p>
            </article>
          ))}
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
      <section className="border-y border-border bg-card">
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
            <div className="w-full max-w-sm border border-border bg-background p-6 md:p-8">
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

      {/* ─── CTA SECTION ─── */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="keyp-section-label mb-4">JOIN NOW</p>
        <h2
          className="text-4xl md:text-5xl font-black mb-6 text-foreground"
          style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}
        >
          {lang === 'ko' ? '지식을 함께 만들어가요' : "Let's Build Knowledge Together"}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          {lang === 'ko'
            ? `${currentSeason.label} 시즌이 진행 중입니다. 지금 참여하여 지식 커뮤니티의 일원이 되세요.`
            : `Season ${currentSeason.label} is in progress. Join now and become part of the knowledge community.`}
        </p>
        <Link href="/feed">
          <button className="keyp-btn-primary flex items-center gap-2 mx-auto text-base px-8 py-3.5">
            {lang === 'ko' ? '플랫폼 입장하기' : 'Enter Platform'}
            <ArrowRight size={16} />
          </button>
        </Link>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-foreground flex items-center justify-center">
              <span className="text-background font-black text-xs" style={{ fontFamily: 'Noto Sans KR' }}>K</span>
            </div>
            <span className="font-black text-sm" style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}>Keyp.</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            © 2026 Keyp. — Korean Knowledge Community · {currentSeason.label}
          </p>
          <div className="flex gap-4">
            {['About', 'Terms', 'Privacy'].map((item) => (
              <button
                key={item}
                className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => toast(`${item} — 준비 중입니다`)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
