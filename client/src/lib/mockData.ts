// ─── KEYP. MOCK DATA ───
// Design Philosophy: Sharp Editorial Intelligence
// All data structures reflect the season-based, bilingual architecture

export interface User {
  id: string;
  username: string;
  displayName: string;
  displayNameEn: string;
  avatar: string;
  bio: string;
  bioEn: string;
  level: number;
  xp: number;
  joinedSeason: string;
  postCount: number;
  commentCount: number;
  isVerified: boolean;
  tags: string[];
}

export interface Season {
  id: string;
  year: number;
  label: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  episodeCount: number;
}

export type ContentStatus = "draft" | "review" | "published";

export interface Category {
  id: string;
  label: string;
  labelEn: string;
  count: number;
}

export interface CmsArticleRecord {
  id: string;
  slug: string;
  category: string;
  author: string;
  status: ContentStatus;
  featured_image: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  seo_title: string;
  seo_description: string;
  season_id: string;
  episode: number;
  original_lang: "ko" | "en";
  read_time: number;
  view_count: number;
  upvote_count: number;
  comment_count: number;
  bookmark_count: number;
  is_read_only: boolean;
  is_featured: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface CmsArticleContentRecord {
  article_id: string;
  locale: "ko" | "en";
  title: string;
  summary: string;
  content: string;
}

export interface CmsArticleTagRecord {
  article_id: string;
  locale: "ko" | "en";
  tag: string;
}

export interface Post {
  id: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  content: string;
  contentEn: string;
  author: User;
  seasonId: string;
  episode: number;
  category: string;
  categoryEn: string;
  tags: string[];
  tagsEn: string[];
  originalLang: 'ko' | 'en';
  readTime: number;
  viewCount: number;
  upvoteCount: number;
  commentCount: number;
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
  isReadOnly: boolean;
  isFeatured: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  author: User;
  content: string;
  contentEn: string;
  originalLang: 'ko' | 'en';
  upvoteCount: number;
  depth: number;
  createdAt: string;
  isReadOnly: boolean;
  replies?: Comment[];
}

// ─── SEASONS ───
export const seasons: Season[] = [
  {
    id: 's2026',
    year: 2026,
    label: 'S2026',
    startDate: '2026-01-01',
    endDate: null,
    isActive: true,
    episodeCount: 30,
  },
];

// ─── USERS ───
export const users: User[] = [
  {
    id: 'u1',
    username: 'kimjihoon',
    displayName: '김지훈',
    displayNameEn: 'Jihoon Kim',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    bio: '서울대학교 컴퓨터공학과 박사과정. 분산 시스템과 AI 인프라를 연구합니다.',
    bioEn: 'PhD candidate at Seoul National University. Researching distributed systems and AI infrastructure.',
    level: 42,
    xp: 8420,
    joinedSeason: 'S2026',
    postCount: 34,
    commentCount: 187,
    isVerified: true,
    tags: ['컴퓨터공학', 'AI', '분산시스템'],
  },
  {
    id: 'u2',
    username: 'parksooyeon',
    displayName: '박수연',
    displayNameEn: 'Sooyeon Park',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
    bio: '경제학 연구자. 한국 경제와 글로벌 금융 시장의 교차점을 탐구합니다.',
    bioEn: 'Economics researcher exploring the intersection of Korean economy and global financial markets.',
    level: 38,
    xp: 6890,
    joinedSeason: 'S2026',
    postCount: 28,
    commentCount: 234,
    isVerified: true,
    tags: ['경제학', '금융', '정책'],
  },
  {
    id: 'u3',
    username: 'alex_chen',
    displayName: 'Alex Chen',
    displayNameEn: 'Alex Chen',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
    bio: '한국어를 배우는 중. 한국 문화와 기술 생태계에 관심이 많습니다.',
    bioEn: 'Learning Korean. Deeply interested in Korean culture and tech ecosystem.',
    level: 15,
    xp: 2340,
    joinedSeason: 'S2026',
    postCount: 8,
    commentCount: 67,
    isVerified: false,
    tags: ['Korean Learning', 'Tech', 'Culture'],
  },
  {
    id: 'u4',
    username: 'leeminjae',
    displayName: '이민재',
    displayNameEn: 'Minjae Lee',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
    bio: '철학과 교수. 동서양 철학의 비교 연구와 현대 윤리학을 가르칩니다.',
    bioEn: 'Philosophy professor teaching comparative East-West philosophy and contemporary ethics.',
    level: 55,
    xp: 12300,
    joinedSeason: 'S2026',
    postCount: 67,
    commentCount: 412,
    isVerified: true,
    tags: ['철학', '윤리학', '동양철학'],
  },
  {
    id: 'u5',
    username: 'sarah_kim',
    displayName: 'Sarah Kim',
    displayNameEn: 'Sarah Kim',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
    bio: '재미교포 2세. 한국어와 영어를 넘나들며 두 문화의 가교 역할을 합니다.',
    bioEn: 'Second-generation Korean-American bridging two cultures through language and writing.',
    level: 29,
    xp: 4560,
    joinedSeason: 'S2026',
    postCount: 19,
    commentCount: 143,
    isVerified: false,
    tags: ['문화', '언어', '교육'],
  },
];

// ─── CATEGORIES ───
const categoryCatalog = [
  { id: "tech", label: "기술", labelEn: "Technology" },
  { id: "science", label: "과학", labelEn: "Science" },
  { id: "economics", label: "경제", labelEn: "Economics" },
  { id: "philosophy", label: "철학", labelEn: "Philosophy" },
  { id: "culture", label: "문화", labelEn: "Culture" },
  { id: "language", label: "언어", labelEn: "Language" },
  { id: "history", label: "역사", labelEn: "History" },
  { id: "society", label: "사회", labelEn: "Society" },
] as const;

// ─── ARTICLE SEED DATA (legacy shape for migration) ───
const articleSeedPosts: Post[] = [
  {
    id: 'p1',
    title: '휴먼인더루프 시대의 의사결정: AX조직은 어떻게 책임을 재설계하는가',
    titleEn: "Decision-Making in the Human-in-the-Loop Era: How AX Organizations Redesign Accountability",
    excerpt: '휴먼인더루프와 AX조직은 단순한 자동화가 아니라 검증 책임 구조의 재편입니다. AI가 초안을 만들고 사람이 최종 판단하는 2026년형 운영 모델을 분석합니다.',
    excerptEn: "Human-in-the-loop and AX organizations are not just automation, but a redesign of accountability. This article examines 2026 operating models where AI drafts and humans make final decisions.",
    content: `## 휴먼인더루프가 표준이 되는 이유

2026년의 AI 운영 모델은 "완전 자동화"보다 "책임 분리"에 초점을 둡니다. AI는 빠르게 초안을 만들고, 사람은 맥락 판단과 위험 승인, 최종 배포를 담당합니다.

## AX조직의 핵심 설계 원칙

AX조직은 도구 도입이 아니라 업무 구조의 재배치입니다. 팀은 프롬프트 작성, 결과 검증, 품질 게이트를 명시적으로 역할화하고, 운영 지표를 정확도·속도·책임성 세 축으로 관리합니다.`,
    contentEn: `## Why Human-in-the-Loop Becomes Standard

In 2026, AI operations prioritize accountable delegation over full automation. AI produces fast drafts, while humans handle contextual judgment, risk approval, and final release.

## Core Design Principles of AX Organizations

AX organizations are about workflow redesign, not tool adoption alone. Teams explicitly define prompt authorship, output validation, and quality gates, tracking performance across accuracy, speed, and accountability.`,
    author: users[0],
    seasonId: 's2026',
    episode: 30,
    category: '기술',
    categoryEn: 'Technology',
    tags: ['휴먼인더루프', 'AX조직', 'AI거버넌스', '검증'],
    tagsEn: ['Human-in-the-Loop', 'AX Organization', 'AI Governance', 'Validation'],
    originalLang: 'ko',
    readTime: 12,
    viewCount: 3847,
    upvoteCount: 284,
    commentCount: 47,
    bookmarkCount: 156,
    createdAt: '2026-04-14T09:30:00Z',
    updatedAt: '2026-04-14T09:30:00Z',
    isReadOnly: false,
    isFeatured: true,
    difficulty: 'advanced',
  },
  {
    id: 'p2',
    title: '프라이스 디코딩 입문: 제로클릭 커머스에서 가격을 읽는 법',
    titleEn: 'Introduction to Price Decoding: Reading Prices in Zero-Click Commerce',
    excerpt: '제로클릭 환경에서는 가격표보다 가격 구조를 해석하는 능력이 중요해집니다. 구독, 번들, 동적 요금제를 해체해보며 2026 소비 전략을 제시합니다.',
    excerptEn: "In zero-click environments, decoding pricing structure matters more than reading price tags. We break down subscriptions, bundles, and dynamic pricing for 2026 consumer strategy.",
    content: `## 제로클릭 소비에서 가격은 어떻게 읽히는가

검색 결과와 요약 카드에서 핵심 정보가 먼저 노출되는 제로클릭 환경에서는 클릭 이후가 아니라 클릭 이전의 가격 신뢰가 구매를 좌우합니다.

## 프라이스 디코딩 프레임워크

사용자는 기본 요금, 변동 요금, 숨은 전환 비용을 분리해 읽어야 합니다. 브랜드는 가격 자체보다 가격 구조를 투명하게 설명할 때 전환과 재구매를 동시에 확보할 수 있습니다.`,
    contentEn: `## How Prices Are Read in Zero-Click Consumption

In zero-click experiences, purchase intent is shaped before the click. Trust in price structure matters more than price display alone.

## A Practical Price-Decoding Framework

Consumers should separate base price, variable price, and switching cost. Brands that explain pricing architecture transparently improve both conversion and retention.`,
    author: users[1],
    seasonId: 's2026',
    episode: 29,
    category: '경제',
    categoryEn: 'Economics',
    tags: ['프라이스 디코딩', '제로클릭', '소비전략', '가격정책'],
    tagsEn: ['Price Decoding', 'Zero Click', 'Consumer Strategy', 'Pricing Policy'],
    originalLang: 'ko',
    readTime: 15,
    viewCount: 5231,
    upvoteCount: 412,
    commentCount: 89,
    bookmarkCount: 234,
    createdAt: '2026-04-13T14:00:00Z',
    updatedAt: '2026-04-13T14:00:00Z',
    isReadOnly: false,
    isFeatured: true,
    difficulty: 'intermediate',
  },
  {
    id: 'p3',
    title: 'Pixel Life 리포트: 픽셀라이프 세대의 기록 습관과 정체성',
    titleEn: 'Pixel Life Report: Logging Habits and Identity in the Pixel Life Generation',
    excerpt: '삶의 장면이 모두 데이터가 되는 픽셀라이프 시대에는 기록 방식이 곧 자아 설계가 됩니다. 개인 브랜딩과 디지털 피로 사이의 균형점을 짚습니다.',
    excerptEn: "In the Pixel Life era, where moments become data, logging behavior shapes identity. This article explores the balance between personal branding and digital fatigue.",
    content: `## 픽셀라이프: 장면의 데이터화

픽셀라이프는 일상을 단순 기록하는 단계에서 벗어나, 데이터로 재구성된 자아를 운영하는 단계로 넘어갑니다. 사진, 위치, 수면, 메모가 연결되어 개인의 의사결정 체계를 만듭니다.

## 디지털 피로와 회복 설계

핵심은 기록량이 아니라 기록 품질입니다. "무엇을 남길지"보다 "무엇을 비울지"를 설계할 때 픽셀라이프는 생산성과 회복력을 함께 높입니다.`,
    contentEn: `## Pixel Life: Datafying Everyday Moments

Pixel Life moves beyond simple logging into operating identity through connected data. Photos, location traces, sleep metrics, and notes become a decision system.

## Designing for Recovery, Not Just Recording

The key is not recording more, but recording better. Choosing what to omit is as important as choosing what to capture.`,
    author: users[2],
    seasonId: 's2026',
    episode: 28,
    category: '언어',
    categoryEn: 'Language',
    tags: ['픽셀라이프', '디지털정체성', '라이프로그', '미디어'],
    tagsEn: ['Pixel Life', 'Digital Identity', 'Life Log', 'Media'],
    originalLang: 'en',
    readTime: 10,
    viewCount: 2156,
    upvoteCount: 198,
    commentCount: 34,
    bookmarkCount: 89,
    createdAt: '2026-04-12T11:00:00Z',
    updatedAt: '2026-04-12T11:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p4',
    title: '근본이즘 선언: 과잉 정보 시대에 신뢰를 설계하는 법',
    titleEn: 'Fundamentalism Manifesto: Designing Trust in an Age of Information Overload',
    excerpt: '근본이즘은 유행을 거부하는 태도가 아니라 핵심 가치로 회귀하는 실천 전략입니다. 제품과 콘텐츠에서 본질 중심 설계 원칙을 정리합니다.',
    excerptEn: "Fundamentalism is not anti-trend, but a practical strategy to return to core value. We outline principles for trust-centered product and content design.",
    content: `## 근본이즘은 무엇을 말하는가

근본이즘은 과거 회귀가 아니라 기준 복원입니다. 빠른 트렌드 전환 속에서도 제품·조직·콘텐츠가 반드시 지켜야 할 핵심 원칙을 명시하는 접근입니다.

## 실행 체크리스트

첫째, 핵심 사용자 문제를 한 문장으로 정의합니다. 둘째, 기능 추가 전에 제거 가능한 복잡도를 먼저 찾습니다. 셋째, 메시지와 기능이 같은 가치를 향하는지 주기적으로 검증합니다.`,
    contentEn: `## What Fundamentalism Actually Means

Fundamentalism is not nostalgia. It is a restoration of standards: clearly defining non-negotiable principles for products, teams, and content.

## Execution Checklist

First, define the core user problem in one sentence. Second, remove avoidable complexity before adding features. Third, continuously verify that messaging and product behavior reflect the same core value.`,
    author: users[3],
    seasonId: 's2026',
    episode: 27,
    category: '철학',
    categoryEn: 'Philosophy',
    tags: ['근본이즘', '신뢰설계', '정보과잉', '철학'],
    tagsEn: ['Fundamentalism', 'Trust Design', 'Information Overload', 'Philosophy'],
    originalLang: 'ko',
    readTime: 18,
    viewCount: 4102,
    upvoteCount: 367,
    commentCount: 62,
    bookmarkCount: 198,
    createdAt: '2026-04-11T08:00:00Z',
    updatedAt: '2026-04-11T08:00:00Z',
    isReadOnly: false,
    isFeatured: true,
    difficulty: 'advanced',
  },
  {
    id: 'p5',
    title: '1.5가구의 부상: 함께 살지 않아도 함께 소비하는 시대',
    titleEn: 'The Rise of 1.5 Households: Consuming Together Without Living Together',
    excerpt: '1.5가구는 1인 가구와 가족 가구 사이의 새로운 생활 단위입니다. 주거·식품·구독 시장이 관계 기반 소비로 재편되는 흐름을 분석합니다.',
    excerptEn: "The 1.5 household is a new lifestyle unit between solo and family households. We analyze how housing, food, and subscriptions are reorganized around relationship-based consumption.",
    content: `## 1.5가구의 정의

1.5가구는 물리적으로 분리되어 살더라도 생활 소비를 공유하는 관계 단위를 의미합니다. 식재료 공동 구매, 계정 결합, 돌봄 분담이 대표 사례입니다.

## 시장 변화 포인트

주거, 식품, 구독 서비스는 개인 단위 최적화에서 관계 단위 최적화로 이동합니다. 기업은 "가구 수"가 아니라 "연결된 생활권"을 기준으로 서비스를 설계해야 합니다.`,
    contentEn: `## Defining the 1.5 Household

A 1.5 household describes people who may not co-live but share practical consumption and care routines.

## Market Implications

Housing, food, and subscriptions are shifting from individual optimization to relationship-based optimization. Service design must target connected living networks, not only physical households.`,
    author: users[4],
    seasonId: 's2026',
    episode: 26,
    category: '문화',
    categoryEn: 'Culture',
    tags: ['1.5가구', '관계소비', '생활트렌드', '가구경제'],
    tagsEn: ['1.5 Household', 'Relationship Consumption', 'Lifestyle Trend', 'Household Economy'],
    originalLang: 'ko',
    readTime: 11,
    viewCount: 6789,
    upvoteCount: 523,
    commentCount: 78,
    bookmarkCount: 312,
    createdAt: '2026-04-10T16:00:00Z',
    updatedAt: '2026-04-10T16:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p6',
    title: '건강지능 HQ: 내 몸의 운영체제를 데이터 허브로 바꾸다',
    titleEn: 'Health Intelligence HQ: Turning Your Body Operating System Into a Data Hub',
    excerpt: '건강지능 HQ는 병원 중심 관리에서 개인 데이터 허브 중심 관리로의 전환입니다. 수면·식습관·스트레스 지표를 의사결정에 연결하는 방법을 다룹니다.',
    excerptEn: "Health Intelligence HQ marks a shift from hospital-centric care to personal data hubs. This article explains how to connect sleep, diet, and stress metrics to daily decisions.",
    content: `## 건강지능 HQ의 등장

건강지능 HQ는 건강 데이터를 병원 밖 일상으로 가져오는 개념입니다. 수면, 심박, 식습관, 활동량 데이터를 하나의 개인 대시보드에서 통합 관리합니다.

## 생활 의사결정과 연결하기

핵심은 수집이 아니라 실행입니다. 개인은 데이터 기반으로 루틴을 조정하고, 조직은 구성원 웰니스 지표를 보호하는 운영 정책을 갖출 때 실질 효과가 발생합니다.`,
    contentEn: `## The Rise of Health Intelligence HQ

Health Intelligence HQ brings health management from isolated medical touchpoints into everyday life through unified personal dashboards.

## Turning Data Into Action

Collection alone is insufficient. Real value appears when people adjust routines from their metrics and organizations support healthier operating policies.`,
    author: users[0],
    seasonId: 's2026',
    episode: 25,
    category: '과학',
    categoryEn: 'Science',
    tags: ['건강지능 HQ', '헬스데이터', '웰니스', '자기관리'],
    tagsEn: ['Health Intelligence HQ', 'Health Data', 'Wellness', 'Self Management'],
    originalLang: 'ko',
    readTime: 14,
    viewCount: 3421,
    upvoteCount: 267,
    commentCount: 41,
    bookmarkCount: 143,
    createdAt: '2026-04-09T10:00:00Z',
    updatedAt: '2026-04-09T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'advanced',
  },
  {
    id: 'p7',
    title: '필코노미 보고서: 결핍 감정이 소비를 움직이는 방식',
    titleEn: 'Feelconomy Report: How Perceived Lack Drives Consumption',
    excerpt: '필코노미는 가격 경쟁이 아니라 감정 경쟁의 시대를 말합니다. 소비자가 결핍을 느끼는 지점을 해석하고, 브랜드가 이를 어떻게 설계하는지 분석합니다.',
    excerptEn: 'Feelconomy signals a shift from price competition to emotional competition. This article analyzes how brands interpret and design around perceived lack.',
    content: `## 필코노미의 핵심 개념

필코노미는 "무엇이 필요한가"보다 "왜 부족하다고 느끼는가"를 중심으로 소비를 해석하는 프레임입니다. 동일한 상품이어도 정체성 결핍을 자극하는 메시지가 구매 행동을 크게 바꿉니다.

## 브랜드 전략의 변화

2026년 브랜드는 기능 설명을 줄이고 감정 언어를 정교화합니다. 제품 상세보다 맥락 설계가 구매 전환을 좌우하며, 커뮤니티 경험이 재구매의 핵심이 됩니다.`,
    contentEn: `## Core Concept of Feelconomy

Feelconomy explains consumption through perceived insufficiency rather than objective need. The same product can perform differently depending on how identity gaps are framed.

## Strategic Shift for Brands

In 2026, brands reduce feature-heavy messaging and sharpen emotional context. Conversion is driven less by specification and more by narrative relevance and community experience.`,
    author: users[1],
    seasonId: 's2026',
    episode: 24,
    category: '경제',
    categoryEn: 'Economics',
    tags: ['필코노미', '감정소비', '브랜드전략', '소비심리'],
    tagsEn: ['Feelconomy', 'Emotional Consumption', 'Brand Strategy', 'Consumer Psychology'],
    originalLang: 'ko',
    readTime: 9,
    viewCount: 2954,
    upvoteCount: 231,
    commentCount: 33,
    bookmarkCount: 121,
    createdAt: '2026-04-08T10:00:00Z',
    updatedAt: '2026-04-08T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p8',
    title: '제로클릭 인터페이스: 클릭 전에 끝나는 검색 경험 설계',
    titleEn: 'Zero-Click Interfaces: Designing Search Journeys That End Before the Click',
    excerpt: '제로클릭 시대에는 체류시간보다 즉시 이해가 더 중요해집니다. 정보 요약 카드, AI 스니펫, 미리보기 중심의 콘텐츠 구조를 정리합니다.',
    excerptEn: 'In the zero-click era, instant comprehension matters more than dwell time. We examine content structures built around summaries, AI snippets, and previews.',
    content: `## 제로클릭 전환의 배경

검색 결과에서 정답형 정보가 바로 제공되면서 사용자는 페이지 이동 없이 결정을 내립니다. 콘텐츠 경쟁의 기준이 "방문 유도"에서 "첫 화면 가치 전달"로 이동합니다.

## 제작자 대응 전략

핵심 질문은 더 많이 클릭시키는 방법이 아니라 더 빨리 신뢰를 전달하는 방법입니다. 제목·요약·근거 데이터를 한 세트로 설계해야 브랜드 검색 점유율이 유지됩니다.`,
    contentEn: `## Why Zero-Click Is Expanding

Answer-style results let users decide without visiting destination pages. Competition moves from attracting clicks to delivering trust and clarity at first glance.

## Response Strategy for Creators

The priority is not maximizing clicks, but maximizing confidence quickly. Titles, summaries, and evidence blocks must be designed as one unit.`,
    author: users[2],
    seasonId: 's2026',
    episode: 23,
    category: '기술',
    categoryEn: 'Technology',
    tags: ['제로클릭', '검색UX', '콘텐츠전략', '정보설계'],
    tagsEn: ['Zero Click', 'Search UX', 'Content Strategy', 'Information Architecture'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 3187,
    upvoteCount: 246,
    commentCount: 29,
    bookmarkCount: 137,
    createdAt: '2026-04-07T10:00:00Z',
    updatedAt: '2026-04-07T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p9',
    title: '레디코어 운영 매뉴얼: 준비된 팀이 실행 속도를 이긴다',
    titleEn: 'Ready Core Operations Manual: Why Prepared Teams Beat Fast Teams',
    excerpt: '레디코어는 빨리 하는 능력이 아니라 준비되어 있는 상태를 경쟁력으로 보는 개념입니다. 템플릿·체크리스트·자동화를 기반으로 한 조직 실행력을 다룹니다.',
    excerptEn: 'Ready Core treats preparedness as competitive advantage, not mere speed. This article covers execution power built on templates, checklists, and automation.',
    content: `## 레디코어란 무엇인가

레디코어는 업무 시작 전 상태를 표준화해 실행 리스크를 줄이는 운영 철학입니다. 회의록 템플릿, 배포 체크리스트, 장애 대응 플레이북이 핵심 자산이 됩니다.

## 2026 조직의 적용 포인트

개인은 속도보다 반복 가능한 품질을, 팀은 영웅적 대응보다 시스템적 대응을 추구합니다. 준비도가 높을수록 예측 가능한 성과를 만들 수 있습니다.`,
    contentEn: `## What Ready Core Means

Ready Core is an operational philosophy that standardizes pre-execution conditions to reduce risk. Meeting templates, release checklists, and incident playbooks become strategic assets.

## 2026 Implementation Points

Individuals prioritize repeatable quality over raw speed, and teams prioritize systems over heroic response. Higher readiness yields more predictable outcomes.`,
    author: users[3],
    seasonId: 's2026',
    episode: 22,
    category: '사회',
    categoryEn: 'Society',
    tags: ['레디코어', '운영전략', '업무자동화', '팀생산성'],
    tagsEn: ['Ready Core', 'Operations Strategy', 'Workflow Automation', 'Team Productivity'],
    originalLang: 'ko',
    readTime: 10,
    viewCount: 2765,
    upvoteCount: 204,
    commentCount: 27,
    bookmarkCount: 112,
    createdAt: '2026-04-06T10:00:00Z',
    updatedAt: '2026-04-06T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p10',
    title: 'AX조직 플레이북: AI 전환을 팀 구조에 이식하는 방법',
    titleEn: 'AX Organization Playbook: Embedding AI Transformation into Team Structure',
    excerpt: 'AX조직은 AI 도입 프로젝트가 아니라 조직 설계 프로젝트입니다. 역할, 권한, 검증 루프를 재배치해 전환 실패를 줄이는 실전 프레임을 제시합니다.',
    excerptEn: 'AX organization is not a tool rollout, but an organizational design project. We present a practical framework to reduce transition failure by redesigning roles, authority, and validation loops.',
    content: `## AX조직이 필요한 이유

AI 도입이 실패하는 가장 큰 원인은 기술 성능이 아니라 책임 경계의 모호함입니다. 누가 생성하고, 누가 검증하며, 누가 최종 승인하는지가 명확하지 않으면 운영 리스크가 커집니다.

## 팀 단위 전환 프레임

AX조직은 직무를 "생성-검증-배포" 흐름으로 재정의합니다. 이를 통해 품질 기준, 감사 가능성, 학습 피드백이 조직 내에서 닫힌 루프를 형성하게 됩니다.`,
    contentEn: `## Why AX Organization Matters

Most AI rollouts fail due to unclear accountability, not weak model quality. Without clear ownership of generation, validation, and release, operational risk scales quickly.

## Team-Level Transformation Framework

AX organizations redefine work around a generate-validate-release loop. This creates stronger quality standards, auditability, and faster learning feedback cycles.`,
    author: users[0],
    seasonId: 's2026',
    episode: 21,
    category: '기술',
    categoryEn: 'Technology',
    tags: ['AX조직', 'AI전환', '조직설계', '거버넌스'],
    tagsEn: ['AX Organization', 'AI Transformation', 'Org Design', 'Governance'],
    originalLang: 'ko',
    readTime: 11,
    viewCount: 3324,
    upvoteCount: 258,
    commentCount: 36,
    bookmarkCount: 149,
    createdAt: '2026-04-05T10:00:00Z',
    updatedAt: '2026-04-05T10:00:00Z',
    isReadOnly: false,
    isFeatured: true,
    difficulty: 'advanced',
  },
  {
    id: 'p11',
    title: '교실의 휴먼인더루프: AI 튜터와 교사의 역할 분업',
    titleEn: 'Human-in-the-Loop in Classrooms: Role Division Between AI Tutors and Teachers',
    excerpt: '교육 현장에서 AI 튜터가 확산될수록 교사의 역할은 사라지는 것이 아니라 재정의됩니다. 학습 진단과 피드백의 책임 분리를 다룹니다.',
    excerptEn: 'As AI tutors spread in classrooms, teachers are not replaced but redefined. This article covers accountable role separation in diagnosis and feedback.',
    content: `## 교육형 휴먼인더루프 모델

AI는 반복 설명과 수준별 문제 추천을 담당하고, 교사는 학습 동기와 맥락 판단을 담당합니다.

## 평가의 책임 기준

최종 성취 평가는 반드시 교사가 검증 루프를 거치도록 설계할 때 공정성이 유지됩니다.`,
    contentEn: `## Educational Human-in-the-Loop Model

AI handles repetitive explanation and adaptive practice while teachers own motivation and context judgment.

## Accountability in Assessment

Fairness improves when final achievement evaluation always passes a teacher-led validation loop.`,
    author: users[0],
    seasonId: 's2026',
    episode: 20,
    category: '기술',
    categoryEn: 'Technology',
    tags: ['휴먼인더루프', '에듀테크', '교사역할', '학습평가'],
    tagsEn: ['Human-in-the-Loop', 'EdTech', 'Teacher Role', 'Assessment'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 2520,
    upvoteCount: 180,
    commentCount: 21,
    bookmarkCount: 98,
    createdAt: '2026-04-04T10:00:00Z',
    updatedAt: '2026-04-04T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p12',
    title: '필코노미와 청소년 소비 교육: 감정 예산 설계법',
    titleEn: 'Feelconomy and Teen Consumer Education: Designing an Emotional Budget',
    excerpt: '청소년 소비 교육에서 가격표 읽기보다 감정 촉발 요인을 이해하는 능력이 중요해지고 있습니다. 필코노미 관점의 실천 가이드를 제시합니다.',
    excerptEn: 'In teen consumer education, understanding emotional triggers is becoming as important as reading price tags. We provide a practical Feelconomy guide.',
    content: `## 감정 예산의 필요성

구매 결정은 소득만으로 설명되지 않습니다. 비교 불안, 소외감, 보상 욕구가 실제 지출을 크게 좌우합니다.

## 교육 적용

학교와 가정은 월 예산표에 감정 메모 칸을 추가해 소비 패턴을 함께 분석할 수 있습니다.`,
    contentEn: `## Why Emotional Budgeting Matters

Spending cannot be explained by income alone. Anxiety, exclusion fear, and reward seeking strongly influence purchases.

## Educational Application

Schools and families can add an emotion-log column to monthly budget sheets and review patterns together.`,
    author: users[1],
    seasonId: 's2026',
    episode: 19,
    category: '경제',
    categoryEn: 'Economics',
    tags: ['필코노미', '소비교육', '감정예산', '청소년'],
    tagsEn: ['Feelconomy', 'Consumer Education', 'Emotional Budget', 'Teen'],
    originalLang: 'ko',
    readTime: 7,
    viewCount: 2410,
    upvoteCount: 165,
    commentCount: 18,
    bookmarkCount: 84,
    createdAt: '2026-04-03T10:00:00Z',
    updatedAt: '2026-04-03T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p13',
    title: '1.5가구 돌봄 네트워크: 지역 커뮤니티 운영 모델',
    titleEn: 'Care Networks for 1.5 Households: A Community Operations Model',
    excerpt: '함께 살지 않아도 돌봄을 분담하는 1.5가구가 늘고 있습니다. 지역 기반의 시간 교환형 돌봄 모델을 교육 사례 중심으로 분석합니다.',
    excerptEn: '1.5 households increasingly share care without co-living. We analyze local time-exchange care models with educational case studies.',
    content: `## 관계 기반 돌봄의 확장

친구·친척·이웃 중심의 비동거 돌봄 네트워크가 육아와 학습 지원까지 확장되고 있습니다.

## 운영 원칙

책임 시간표, 위기 연락망, 비용 분담 규칙을 문서화하면 갈등 비용을 크게 줄일 수 있습니다.`,
    contentEn: `## Expansion of Relationship-Based Care

Non-co-living care networks among friends and neighbors now support childcare and learning assistance.

## Operating Principles

Documented schedules, emergency contacts, and cost-sharing rules dramatically reduce coordination conflict.`,
    author: users[4],
    seasonId: 's2026',
    episode: 18,
    category: '사회',
    categoryEn: 'Society',
    tags: ['1.5가구', '돌봄네트워크', '커뮤니티', '사회혁신'],
    tagsEn: ['1.5 Household', 'Care Network', 'Community', 'Social Innovation'],
    originalLang: 'ko',
    readTime: 9,
    viewCount: 2265,
    upvoteCount: 171,
    commentCount: 17,
    bookmarkCount: 79,
    createdAt: '2026-04-02T10:00:00Z',
    updatedAt: '2026-04-02T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p14',
    title: '건강지능 HQ 실습: 학생 수면 데이터 읽기 워크숍',
    titleEn: 'Health Intelligence HQ Workshop: Reading Student Sleep Data',
    excerpt: '수면 데이터를 활용한 학습 효율 개선 실습을 소개합니다. 건강지능 HQ 관점에서 데이터 해석과 행동 변화 연결법을 다룹니다.',
    excerptEn: 'This workshop introduces practical ways to improve learning efficiency using sleep data. We connect interpretation and behavior change through Health Intelligence HQ.',
    content: `## 수면-학습 상관 분석

취침 시각, 중간 각성, 기상 직후 컨디션 지표는 학습 집중도와 높은 상관을 보입니다.

## 학교 현장 적용

학생 개인 비교보다 개인 내 변화 추세를 보는 방식이 낙인 없이 개선을 유도합니다.`,
    contentEn: `## Sleep-Learning Correlation

Bedtime, night awakenings, and morning readiness strongly correlate with focus and retention.

## School Implementation

Tracking personal trends over peer comparison enables improvement without stigma.`,
    author: users[0],
    seasonId: 's2026',
    episode: 17,
    category: '과학',
    categoryEn: 'Science',
    tags: ['건강지능 HQ', '수면데이터', '학습과학', '웰니스'],
    tagsEn: ['Health Intelligence HQ', 'Sleep Data', 'Learning Science', 'Wellness'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 2488,
    upvoteCount: 176,
    commentCount: 20,
    bookmarkCount: 88,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p15',
    title: '픽셀라이프 시대의 학습 기록법: 노트, 영상, 로그의 통합',
    titleEn: 'Learning Records in the Pixel Life Era: Integrating Notes, Video, and Logs',
    excerpt: '학습 기록이 텍스트 노트를 넘어 영상·데이터 로그로 확장되고 있습니다. 픽셀라이프형 학습 포트폴리오 설계를 제안합니다.',
    excerptEn: 'Learning records now extend beyond text notes to video and data logs. We propose a Pixel Life-style learning portfolio design.',
    content: `## 기록의 포맷 전환

요약 노트만으로는 학습 과정의 맥락이 누락됩니다. 영상 캡처와 행동 로그를 함께 보존하면 피드백 정확도가 높아집니다.

## 포트폴리오 설계

학습 목표, 시도 기록, 반성 로그를 주간 단위로 묶어 관리하는 방식이 효과적입니다.`,
    contentEn: `## Format Shift in Learning Records

Text summaries alone miss process context. Pairing clip captures with behavior logs improves feedback quality.

## Portfolio Design

Weekly bundles of goals, attempts, and reflections produce clearer growth trajectories.`,
    author: users[2],
    seasonId: 's2026',
    episode: 16,
    category: '문화',
    categoryEn: 'Culture',
    tags: ['픽셀라이프', '학습기록', '포트폴리오', '에듀컬처'],
    tagsEn: ['Pixel Life', 'Learning Records', 'Portfolio', 'Edu Culture'],
    originalLang: 'ko',
    readTime: 9,
    viewCount: 2301,
    upvoteCount: 169,
    commentCount: 19,
    bookmarkCount: 92,
    createdAt: '2026-03-31T10:00:00Z',
    updatedAt: '2026-03-31T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p16',
    title: '제로클릭 학습 검색: 질문 설계가 성과를 바꾼다',
    titleEn: 'Zero-Click Learning Search: Better Questions, Better Outcomes',
    excerpt: '학습 검색에서도 제로클릭 환경이 보편화되고 있습니다. 핵심은 더 많이 찾는 것이 아니라 더 정확히 질문하는 능력입니다.',
    excerptEn: 'Zero-click behavior is now common in learning search too. Success depends less on searching more and more on asking better questions.',
    content: `## 질문 구조의 중요성

검색 품질은 키워드 수보다 문제 정의의 명확성에 좌우됩니다. 조건·맥락·제약을 같이 적는 방식이 유효합니다.

## 교육 적용 포인트

학생에게 "정답 찾기"보다 "질문 세분화"를 훈련하면 정보 판별력이 개선됩니다.`,
    contentEn: `## Why Question Structure Matters

Search quality depends more on problem clarity than keyword volume. Including constraints and context yields stronger results.

## Educational Application

Training students to refine questions improves information judgment more than answer hunting.`,
    author: users[2],
    seasonId: 's2026',
    episode: 15,
    category: '언어',
    categoryEn: 'Language',
    tags: ['제로클릭', '질문설계', '학습검색', '정보문해력'],
    tagsEn: ['Zero Click', 'Question Design', 'Learning Search', 'Information Literacy'],
    originalLang: 'en',
    readTime: 7,
    viewCount: 2214,
    upvoteCount: 158,
    commentCount: 16,
    bookmarkCount: 75,
    createdAt: '2026-03-30T10:00:00Z',
    updatedAt: '2026-03-30T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p17',
    title: '레디코어 커리큘럼: 프로젝트 시작 전에 끝내야 할 7가지',
    titleEn: 'Ready Core Curriculum: 7 Things to Finish Before Project Kickoff',
    excerpt: '레디코어 관점에서 프로젝트 실패를 줄이기 위한 사전 준비 체크리스트를 제시합니다. 교육 조직과 스타트업 모두 적용 가능합니다.',
    excerptEn: 'From a Ready Core perspective, this article offers a pre-start checklist to reduce project failure in both educational teams and startups.',
    content: `## 준비가 성과를 만든다

프로젝트의 질은 착수 이후가 아니라 착수 이전에 결정됩니다. 목표 정의·평가 기준·역할 분리 문서화가 핵심입니다.

## 7가지 체크리스트

목표 문장, 성공 지표, 실패 기준, 일정 가정, 의사결정권자, 커뮤니케이션 채널, 리스크 대응안을 사전 확정합니다.`,
    contentEn: `## Readiness Drives Outcomes

Project quality is often determined before kickoff. Documenting scope, metrics, and role ownership is essential.

## Seven-Point Checklist

Fix objective, success metric, failure threshold, schedule assumptions, decision owners, channels, and risk responses upfront.`,
    author: users[0],
    seasonId: 's2026',
    episode: 14,
    category: '기술',
    categoryEn: 'Technology',
    tags: ['레디코어', '프로젝트관리', '체크리스트', '실행전략'],
    tagsEn: ['Ready Core', 'Project Management', 'Checklist', 'Execution Strategy'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 2390,
    upvoteCount: 172,
    commentCount: 18,
    bookmarkCount: 86,
    createdAt: '2026-03-29T10:00:00Z',
    updatedAt: '2026-03-29T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p18',
    title: '프라이스 디코딩 실전: 구독형 교육 서비스 비교법',
    titleEn: 'Price Decoding in Practice: Comparing Subscription Learning Services',
    excerpt: '교육 구독 서비스의 가격을 액면가로 비교하면 오판하기 쉽습니다. 실사용 시간과 전환 비용까지 포함한 계산식을 제안합니다.',
    excerptEn: 'Comparing education subscriptions by list price alone can mislead. We propose a formula including actual usage and switching costs.',
    content: `## 가격표 바깥의 비용

가입 비용, 해지 페널티, 데이터 이관 시간은 숨은 비용으로 작동합니다.

## 비교 프레임

월 단가를 "학습 1시간당 비용"으로 환산하면 서비스 간 실질 차이를 명확히 볼 수 있습니다.`,
    contentEn: `## Costs Beyond the Sticker Price

Onboarding, cancellation friction, and migration time are hidden costs.

## Comparison Framework

Normalizing monthly fees into cost per learning hour reveals practical differences clearly.`,
    author: users[1],
    seasonId: 's2026',
    episode: 13,
    category: '경제',
    categoryEn: 'Economics',
    tags: ['프라이스 디코딩', '구독경제', '교육서비스', '비용분석'],
    tagsEn: ['Price Decoding', 'Subscription Economy', 'Education Service', 'Cost Analysis'],
    originalLang: 'ko',
    readTime: 7,
    viewCount: 2148,
    upvoteCount: 151,
    commentCount: 15,
    bookmarkCount: 70,
    createdAt: '2026-03-28T10:00:00Z',
    updatedAt: '2026-03-28T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p19',
    title: '근본이즘 수업 설계: 유행보다 개념을 먼저 가르치기',
    titleEn: 'Fundamentalist Course Design: Teaching Concepts Before Trends',
    excerpt: '근본이즘은 교육에서도 유효합니다. 최신 도구 소개보다 개념 구조를 먼저 가르칠 때 학습 전이가 높아집니다.',
    excerptEn: 'Fundamentalism applies to education as well. Teaching conceptual structures before tool trends increases transferability.',
    content: `## 도구 중심 수업의 한계

도구가 바뀔 때마다 학습 가치가 사라지는 커리큘럼은 장기 역량을 만들기 어렵습니다.

## 개념 우선 설계

원리-사례-도구의 순서로 수업을 구성하면 환경 변화에도 적용 가능한 사고력을 유지할 수 있습니다.`,
    contentEn: `## Limits of Tool-Centered Teaching

Curricula tied only to tools lose value when platforms change.

## Concept-First Design

Structuring lessons as principle-case-tool preserves transferable thinking across contexts.`,
    author: users[3],
    seasonId: 's2026',
    episode: 12,
    category: '철학',
    categoryEn: 'Philosophy',
    tags: ['근본이즘', '교육철학', '커리큘럼', '개념학습'],
    tagsEn: ['Fundamentalism', 'Education Philosophy', 'Curriculum', 'Concept Learning'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 2066,
    upvoteCount: 149,
    commentCount: 14,
    bookmarkCount: 69,
    createdAt: '2026-03-27T10:00:00Z',
    updatedAt: '2026-03-27T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p20',
    title: '건강지능 HQ 데이터 윤리: 학생 웰니스 정보의 경계',
    titleEn: 'Health Intelligence HQ Data Ethics: Boundaries of Student Wellness Data',
    excerpt: '건강지능 HQ가 확산되면서 데이터 활용 윤리 기준이 중요해졌습니다. 수집 최소화와 목적 제한 원칙을 중심으로 다룹니다.',
    excerptEn: 'As Health Intelligence HQ expands, ethical boundaries for data use become critical. This piece focuses on minimization and purpose limitation.',
    content: `## 데이터 수집 최소화

필요한 데이터만 수집하고 보관 기간을 명확히 정해야 남용 위험을 줄일 수 있습니다.

## 설명 가능성과 동의

학습자와 보호자에게 데이터 활용 목적을 이해 가능한 언어로 설명해야 신뢰가 유지됩니다.`,
    contentEn: `## Data Minimization First

Collect only what is necessary and define retention windows to reduce misuse risk.

## Explainability and Consent

Trust is sustained when learners and guardians understand data purpose in plain language.`,
    author: users[0],
    seasonId: 's2026',
    episode: 11,
    category: '과학',
    categoryEn: 'Science',
    tags: ['건강지능 HQ', '데이터윤리', '개인정보', '웰니스'],
    tagsEn: ['Health Intelligence HQ', 'Data Ethics', 'Privacy', 'Wellness'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 2199,
    upvoteCount: 154,
    commentCount: 16,
    bookmarkCount: 73,
    createdAt: '2026-03-26T10:00:00Z',
    updatedAt: '2026-03-26T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'advanced',
  },
  {
    id: 'p21',
    title: '픽셀라이프와 문화 피로: 기록 과잉 시대의 디지털 휴식',
    titleEn: 'Pixel Life and Cultural Fatigue: Digital Rest in an Over-Logging Era',
    excerpt: '기록 가능한 모든 것을 기록하는 문화가 피로를 유발하고 있습니다. 픽셀라이프 시대의 디지털 휴식 프로토콜을 제안합니다.',
    excerptEn: 'A culture of logging everything is creating fatigue. We propose digital rest protocols for the Pixel Life era.',
    content: `## 기록 과잉의 징후

학습 목적보다 인증 목적이 커지면 기록은 성장을 돕지 못하고 불안을 확대합니다.

## 휴식 프로토콜

주 1회 비기록일, 월 1회 데이터 정리일을 설정하면 집중과 회복의 균형이 맞춰집니다.`,
    contentEn: `## Signs of Over-Logging

When documentation serves validation over learning, it increases anxiety rather than growth.

## Rest Protocol

A weekly no-log day and monthly data-prune day restore focus and recovery balance.`,
    author: users[4],
    seasonId: 's2026',
    episode: 10,
    category: '문화',
    categoryEn: 'Culture',
    tags: ['픽셀라이프', '디지털휴식', '문화피로', '미디어리터러시'],
    tagsEn: ['Pixel Life', 'Digital Rest', 'Cultural Fatigue', 'Media Literacy'],
    originalLang: 'ko',
    readTime: 7,
    viewCount: 2055,
    upvoteCount: 143,
    commentCount: 13,
    bookmarkCount: 67,
    createdAt: '2026-03-25T10:00:00Z',
    updatedAt: '2026-03-25T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p22',
    title: '휴먼인더루프 평가 루브릭: AI 과제 피드백 표준안',
    titleEn: 'Human-in-the-Loop Rubric: A Standard for AI-Assisted Assignment Feedback',
    excerpt: 'AI 보조 과제의 평가는 도구 사용 여부가 아니라 사고 과정의 검증 가능성으로 이뤄져야 합니다. 루브릭 표준안을 제시합니다.',
    excerptEn: 'Assessment of AI-assisted assignments should focus on verifiable reasoning, not tool usage itself. This article proposes a practical rubric.',
    content: `## 루브릭 설계 원칙

결과물 점수만으로는 AI 개입 품질을 판단하기 어렵습니다. 프롬프트 의도, 검증 절차, 수정 기록을 함께 평가해야 합니다.

## 교사 적용 팁

학생 제출물에 "초안-검증-수정" 로그를 포함시키면 피드백의 객관성이 높아집니다.`,
    contentEn: `## Rubric Design Principles

Output-only grading cannot evaluate AI intervention quality. Prompt intent, validation steps, and revision logs should be assessed together.

## Classroom Tip

Requiring draft-validate-revise logs improves feedback objectivity.`,
    author: users[0],
    seasonId: 's2026',
    episode: 9,
    category: '기술',
    categoryEn: 'Technology',
    tags: ['휴먼인더루프', '평가루브릭', 'AI과제', '검증가능성'],
    tagsEn: ['Human-in-the-Loop', 'Rubric', 'AI Assignments', 'Verifiability'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 2241,
    upvoteCount: 160,
    commentCount: 15,
    bookmarkCount: 74,
    createdAt: '2026-03-24T10:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p23',
    title: 'AX조직과 학교 행정: 업무 재설계 체크포인트',
    titleEn: 'AX Organization in School Administration: Workflow Redesign Checkpoints',
    excerpt: '학교 행정에 AI를 도입할 때 가장 필요한 것은 도구 교육이 아니라 프로세스 재설계입니다. AX조직 체크포인트를 정리했습니다.',
    excerptEn: 'When introducing AI in school administration, process redesign matters more than tool training. We summarize AX organization checkpoints.',
    content: `## 행정 자동화의 오해

기존 업무를 그대로 자동화하면 병목이 더 빨리 반복될 수 있습니다.

## 체크포인트

입력 책임, 검토 단계, 예외 처리 기준을 먼저 정의한 뒤 자동화를 적용해야 안정성이 높아집니다.`,
    contentEn: `## Misconception in Admin Automation

Automating flawed workflows can amplify bottlenecks faster.

## Checkpoints

Define input ownership, review steps, and exception rules before automation for stable outcomes.`,
    author: users[3],
    seasonId: 's2026',
    episode: 8,
    category: '사회',
    categoryEn: 'Society',
    tags: ['AX조직', '학교행정', '업무재설계', '자동화'],
    tagsEn: ['AX Organization', 'School Admin', 'Workflow Redesign', 'Automation'],
    originalLang: 'ko',
    readTime: 7,
    viewCount: 1988,
    upvoteCount: 140,
    commentCount: 12,
    bookmarkCount: 61,
    createdAt: '2026-03-23T10:00:00Z',
    updatedAt: '2026-03-23T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p24',
    title: '제로클릭 시대의 언어 교육: 요약 문해력 훈련',
    titleEn: 'Language Education in the Zero-Click Era: Training Summary Literacy',
    excerpt: '짧은 요약을 빠르게 읽는 능력이 언어 학습의 새 기초 역량이 되고 있습니다. 제로클릭 환경에 맞는 문해력 훈련법을 제시합니다.',
    excerptEn: 'Rapid interpretation of concise summaries is becoming a core language skill. We propose summary literacy training for zero-click environments.',
    content: `## 요약 문해력의 부상

긴 글을 끝까지 읽기 전에 판단이 이루어지는 환경에서는 핵심 문장 해석 능력이 중요합니다.

## 수업 적용

한 문단 요약-검증-반박 과정을 반복하면 비판적 문해력이 빠르게 향상됩니다.`,
    contentEn: `## Rise of Summary Literacy

In decision-first reading environments, interpreting key lines accurately is essential.

## Classroom Method

Repeated summarize-verify-counter cycles improve critical literacy quickly.`,
    author: users[2],
    seasonId: 's2026',
    episode: 7,
    category: '언어',
    categoryEn: 'Language',
    tags: ['제로클릭', '언어교육', '요약문해력', '비판적읽기'],
    tagsEn: ['Zero Click', 'Language Education', 'Summary Literacy', 'Critical Reading'],
    originalLang: 'en',
    readTime: 7,
    viewCount: 1933,
    upvoteCount: 136,
    commentCount: 11,
    bookmarkCount: 59,
    createdAt: '2026-03-22T10:00:00Z',
    updatedAt: '2026-03-22T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p25',
    title: '필코노미 광고 읽기: 결핍 자극 메시지 해부',
    titleEn: 'Reading Feelconomy Ads: Dissecting Scarcity-Stimulating Messaging',
    excerpt: '필코노미 광고는 제품 정보보다 감정 결핍을 먼저 자극합니다. 광고 문구를 해부해 소비자 교육에 적용할 수 있는 틀을 제공합니다.',
    excerptEn: 'Feelconomy ads often trigger emotional scarcity before delivering product information. We provide a framework for consumer education.',
    content: `## 메시지 구조 분석

"당신만 놓치고 있다" 유형의 문구는 정보 전달보다 불안 증폭을 목표로 합니다.

## 실천 프레임

광고를 볼 때 정보 문장과 감정 문장을 분리해 읽으면 충동 구매를 줄일 수 있습니다.`,
    contentEn: `## Message Structure Analysis

“You are falling behind” framing aims to amplify anxiety over information value.

## Practical Framework

Separating factual lines from emotional trigger lines helps reduce impulsive purchasing.`,
    author: users[1],
    seasonId: 's2026',
    episode: 6,
    category: '경제',
    categoryEn: 'Economics',
    tags: ['필코노미', '광고문해력', '소비자교육', '감정트리거'],
    tagsEn: ['Feelconomy', 'Ad Literacy', 'Consumer Education', 'Emotional Trigger'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 2011,
    upvoteCount: 142,
    commentCount: 13,
    bookmarkCount: 64,
    createdAt: '2026-03-21T10:00:00Z',
    updatedAt: '2026-03-21T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p26',
    title: '프라이스 디코딩과 AI 도구 비용: 팀 예산 운영법',
    titleEn: 'Price Decoding and AI Tool Costs: Team Budget Operations',
    excerpt: 'AI 도구 구독이 늘수록 팀 예산의 가시성이 중요해집니다. 프라이스 디코딩 관점에서 SaaS 비용 운영 체계를 정리합니다.',
    excerptEn: 'As AI subscriptions grow, budget visibility becomes critical. This article outlines SaaS cost operations through the lens of price decoding.',
    content: `## 비용 구조를 보는 법

좌석 비용, 사용량 비용, 연동 비용을 분리해 추적해야 누적 과금 위험을 줄일 수 있습니다.

## 운영 체계

월간 비용 리뷰와 분기별 해지 시뮬레이션을 도입하면 불필요한 구독을 빠르게 정리할 수 있습니다.`,
    contentEn: `## Reading Cost Architecture

Separate seat fees, usage fees, and integration fees to control cumulative risk.

## Operating Cadence

Monthly review plus quarterly cancellation simulations helps prune unnecessary subscriptions.`,
    author: users[0],
    seasonId: 's2026',
    episode: 5,
    category: '기술',
    categoryEn: 'Technology',
    tags: ['프라이스 디코딩', 'AI도구', 'SaaS비용', '팀예산'],
    tagsEn: ['Price Decoding', 'AI Tools', 'SaaS Cost', 'Team Budget'],
    originalLang: 'ko',
    readTime: 9,
    viewCount: 2077,
    upvoteCount: 147,
    commentCount: 13,
    bookmarkCount: 66,
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p27',
    title: '근본이즘과 교육 평가: 측정 가능한 본질 찾기',
    titleEn: 'Fundamentalism and Educational Assessment: Finding Measurable Essentials',
    excerpt: '평가 지표가 많아질수록 본질이 흐려질 수 있습니다. 근본이즘 관점에서 핵심 성과지표를 재정렬하는 방법을 다룹니다.',
    excerptEn: 'As assessment metrics multiply, essentials can blur. We discuss how to realign core KPIs through a fundamentalist lens.',
    content: `## 지표 과잉의 함정

측정 가능한 것만 측정하면 중요한 것들이 빠질 수 있습니다.

## 핵심 지표 재정렬

성과 지표를 학습 지속성, 개념 이해도, 협업 역량 3개 축으로 단순화하면 운영 품질이 개선됩니다.`,
    contentEn: `## Pitfall of Metric Overload

Measuring only what is easy can hide what matters.

## KPI Realignment

Simplifying KPIs into persistence, conceptual mastery, and collaboration improves educational operations.`,
    author: users[3],
    seasonId: 's2026',
    episode: 4,
    category: '철학',
    categoryEn: 'Philosophy',
    tags: ['근본이즘', '평가지표', '교육평가', 'KPI'],
    tagsEn: ['Fundamentalism', 'Assessment Metrics', 'Educational Evaluation', 'KPI'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 1899,
    upvoteCount: 132,
    commentCount: 10,
    bookmarkCount: 58,
    createdAt: '2026-03-19T10:00:00Z',
    updatedAt: '2026-03-19T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
  {
    id: 'p28',
    title: '건강지능 HQ와 학습 생산성: 생체 리듬 기반 시간표',
    titleEn: 'Health Intelligence HQ and Study Productivity: Bio-Rhythm Timetabling',
    excerpt: '획일적 시간표 대신 개인 생체 리듬 기반 학습 설계가 주목받고 있습니다. 건강지능 HQ 데이터를 활용한 실험 사례를 소개합니다.',
    excerptEn: 'Personal bio-rhythm scheduling is gaining attention over fixed timetables. This article introduces practical experiments using Health Intelligence HQ data.',
    content: `## 시간표 개인화의 근거

같은 학습 시간이라도 개인의 각성 주기에 따라 성과 차이가 큽니다.

## 실행 방법

2주간 집중도 로그와 수면 데이터를 함께 기록하면 최적 학습 창을 찾을 수 있습니다.`,
    contentEn: `## Why Personalized Timetables Work

The same study hour can produce very different outcomes depending on arousal cycles.

## How to Run It

Two weeks of focus logs plus sleep data is enough to detect optimal study windows.`,
    author: users[0],
    seasonId: 's2026',
    episode: 3,
    category: '과학',
    categoryEn: 'Science',
    tags: ['건강지능 HQ', '생체리듬', '학습생산성', '데이터기반'],
    tagsEn: ['Health Intelligence HQ', 'Bio Rhythm', 'Study Productivity', 'Data-Driven'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 1965,
    upvoteCount: 138,
    commentCount: 11,
    bookmarkCount: 60,
    createdAt: '2026-03-18T10:00:00Z',
    updatedAt: '2026-03-18T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p29',
    title: 'AX조직 커뮤니케이션: 사람-모델 협업 회의 규칙',
    titleEn: 'AX Organization Communication: Meeting Rules for Human-Model Collaboration',
    excerpt: 'AX조직에서는 회의 방식도 달라져야 합니다. 사람과 모델의 역할이 섞이지 않도록 의사결정 회의 규칙을 제안합니다.',
    excerptEn: 'In AX organizations, meeting formats must evolve. We propose decision rules that keep human and model responsibilities clear.',
    content: `## 회의 프로토콜의 변화

모델 출력은 참고안으로 분리하고, 최종 결론은 책임자 발언으로 확정하는 규칙이 필요합니다.

## 실행 템플릿

"질문-출력-검증-결정" 4단계 회의 템플릿은 협업 품질과 속도를 동시에 높입니다.`,
    contentEn: `## Meeting Protocol Shift

Model output should be treated as draft input, while final conclusions are explicitly owned by accountable humans.

## Execution Template

A four-step flow—question, output, validation, decision—improves both speed and quality.`,
    author: users[0],
    seasonId: 's2026',
    episode: 2,
    category: '기술',
    categoryEn: 'Technology',
    tags: ['AX조직', '협업규칙', '회의운영', '의사결정'],
    tagsEn: ['AX Organization', 'Collaboration Rules', 'Meeting Ops', 'Decision-Making'],
    originalLang: 'ko',
    readTime: 7,
    viewCount: 1880,
    upvoteCount: 131,
    commentCount: 10,
    bookmarkCount: 57,
    createdAt: '2026-03-17T10:00:00Z',
    updatedAt: '2026-03-17T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'beginner',
  },
  {
    id: 'p30',
    title: '1.5가구 소비 지도: 식비·주거·구독의 공동 최적화',
    titleEn: 'Consumption Map for 1.5 Households: Co-Optimizing Food, Housing, and Subscriptions',
    excerpt: '1.5가구는 단일 생활비가 아니라 연결된 생활비를 관리합니다. 공동 최적화 관점의 소비 지도 작성법을 제시합니다.',
    excerptEn: '1.5 households manage connected budgets rather than isolated ones. We introduce a practical map for co-optimizing shared consumption.',
    content: `## 연결 생활비의 개념

생활비를 개인별로만 나누면 공동 소비의 효율을 놓치기 쉽습니다.

## 소비 지도 만들기

고정비·변동비·공유비를 분리한 뒤, 월 단위로 기여율과 이용률을 함께 기록하면 최적화가 가능합니다.`,
    contentEn: `## Concept of Connected Living Cost

Splitting budgets strictly by individual can hide shared efficiency gains.

## Building a Consumption Map

Separate fixed, variable, and shared costs, then track contribution and usage monthly for optimization.`,
    author: users[1],
    seasonId: 's2026',
    episode: 1,
    category: '경제',
    categoryEn: 'Economics',
    tags: ['1.5가구', '공동소비', '생활비', '최적화'],
    tagsEn: ['1.5 Household', 'Shared Consumption', 'Living Cost', 'Optimization'],
    originalLang: 'ko',
    readTime: 8,
    viewCount: 1862,
    upvoteCount: 129,
    commentCount: 10,
    bookmarkCount: 55,
    createdAt: '2026-03-16T10:00:00Z',
    updatedAt: '2026-03-16T10:00:00Z',
    isReadOnly: false,
    isFeatured: false,
    difficulty: 'intermediate',
  },
];

// ─── NOTION-STYLE CONTENT DATABASE (normalized) ───
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9가-힣\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const categoryIdByLabel = new Map<string, string>(
  categoryCatalog.flatMap((c) => [
    [c.label, c.id],
    [c.labelEn, c.id],
  ]),
);

const getFeaturedImage = (post: Post) =>
  post.author.avatar.replace("w=80&h=80", "w=1280&h=720");

const cmsArticles: CmsArticleRecord[] = articleSeedPosts.map((post) => ({
  id: post.id,
  slug: slugify(post.titleEn || post.title),
  category: categoryIdByLabel.get(post.category) || "tech",
  author: post.author.id,
  status: "published",
  featured_image: getFeaturedImage(post),
  created_at: post.createdAt,
  updated_at: post.updatedAt,
  published_at: post.createdAt,
  seo_title: (post.titleEn || post.title).slice(0, 70),
  seo_description: (post.excerptEn || post.excerpt).slice(0, 160),
  season_id: post.seasonId,
  episode: post.episode,
  original_lang: post.originalLang,
  read_time: post.readTime,
  view_count: post.viewCount,
  upvote_count: post.upvoteCount,
  comment_count: post.commentCount,
  bookmark_count: post.bookmarkCount,
  is_read_only: post.isReadOnly,
  is_featured: post.isFeatured,
  difficulty: post.difficulty,
}));

const cmsArticleContents: CmsArticleContentRecord[] = articleSeedPosts.flatMap((post) => [
  {
    article_id: post.id,
    locale: "ko",
    title: post.title,
    summary: post.excerpt,
    content: post.content,
  },
  {
    article_id: post.id,
    locale: "en",
    title: post.titleEn,
    summary: post.excerptEn,
    content: post.contentEn,
  },
]);

const cmsArticleTags: CmsArticleTagRecord[] = articleSeedPosts.flatMap((post) => [
  ...post.tags.map((tag) => ({ article_id: post.id, locale: "ko" as const, tag })),
  ...post.tagsEn.map((tag) => ({ article_id: post.id, locale: "en" as const, tag })),
]);

export const CMS_WORKFLOW: ContentStatus[] = ["draft", "review", "published"];

export const canTransitionStatus = (from: ContentStatus, to: ContentStatus) => {
  const fromIndex = CMS_WORKFLOW.indexOf(from);
  const toIndex = CMS_WORKFLOW.indexOf(to);
  return toIndex === fromIndex || toIndex === fromIndex + 1;
};

export const getNextWorkflowStatus = (status: ContentStatus): ContentStatus =>
  status === "draft" ? "review" : status === "review" ? "published" : "published";

export const contentDatabase = {
  articles: cmsArticles,
  contents: cmsArticleContents,
  tags: cmsArticleTags,
} as const;

const contentByArticleAndLocale = new Map<string, CmsArticleContentRecord>(
  cmsArticleContents.map((content) => [`${content.article_id}:${content.locale}`, content]),
);

const tagsByArticleAndLocale = new Map<string, string[]>();
for (const tag of cmsArticleTags) {
  const key = `${tag.article_id}:${tag.locale}`;
  const prev = tagsByArticleAndLocale.get(key) || [];
  prev.push(tag.tag);
  tagsByArticleAndLocale.set(key, prev);
}

const userById = new Map(users.map((user) => [user.id, user]));
const categoryById = new Map(categoryCatalog.map((c) => [c.id, c]));

const toValidTimestamp = (value: string) => {
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
};

const popularityScore = (post: Post) =>
  post.upvoteCount * 1000 + post.commentCount * 10 + post.viewCount * 0.01;

export const posts: Post[] = cmsArticles
  .filter((article) => article.status === "published")
  .map((article) => {
    const ko = contentByArticleAndLocale.get(`${article.id}:ko`);
    const en = contentByArticleAndLocale.get(`${article.id}:en`);
    const category = categoryById.get(article.category);
    const author = userById.get(article.author) || users[0];

    return {
      id: article.id,
      title: ko?.title || "",
      titleEn: en?.title || "",
      excerpt: ko?.summary || "",
      excerptEn: en?.summary || "",
      content: ko?.content || "",
      contentEn: en?.content || "",
      author,
      seasonId: article.season_id,
      episode: article.episode,
      category: category?.label || "기술",
      categoryEn: category?.labelEn || "Technology",
      tags: tagsByArticleAndLocale.get(`${article.id}:ko`) || [],
      tagsEn: tagsByArticleAndLocale.get(`${article.id}:en`) || [],
      originalLang: article.original_lang,
      readTime: article.read_time,
      viewCount: article.view_count,
      upvoteCount: article.upvote_count,
      commentCount: article.comment_count,
      bookmarkCount: article.bookmark_count,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      isReadOnly: article.is_read_only,
      isFeatured: article.is_featured,
      difficulty: article.difficulty,
    };
  });

export const categories: Category[] = categoryCatalog.map((category) => ({
  ...category,
  count: posts.filter((post) => post.category === category.label).length,
}));

export const queryPosts = (params?: {
  search?: string;
  categoryId?: string;
  seasonId?: string;
  status?: ContentStatus;
  sortBy?: "latest" | "trending" | "top";
}) => {
  const {
    search = "",
    categoryId,
    seasonId,
    status = "published",
    sortBy = "latest",
  } = params || {};

  const q = search.toLowerCase().trim();

  let result = posts.filter((post) => {
    if (status !== "published") return false;
    if (categoryId) {
      const category = categoryById.get(categoryId);
      if (!category || post.category !== category.label) return false;
    }
    if (seasonId && post.seasonId !== seasonId) return false;
    if (!q) return true;

    const searchable = [
      post.title,
      post.titleEn,
      post.excerpt,
      post.excerptEn,
      post.content,
      post.contentEn,
      post.category,
      post.categoryEn,
      ...post.tags,
      ...post.tagsEn,
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });

  result = result.sort((a, b) => {
    if (sortBy === "top") {
      const upvoteDiff = b.upvoteCount - a.upvoteCount;
      if (upvoteDiff !== 0) return upvoteDiff;
      const popularityDiff = popularityScore(b) - popularityScore(a);
      if (popularityDiff !== 0) return popularityDiff;
    }
    if (sortBy === "trending") return b.viewCount - a.viewCount;
    const createdDiff = toValidTimestamp(b.createdAt) - toValidTimestamp(a.createdAt);
    if (createdDiff !== 0) return createdDiff;
    const updatedDiff = toValidTimestamp(b.updatedAt) - toValidTimestamp(a.updatedAt);
    if (updatedDiff !== 0) return updatedDiff;
    const episodeDiff = b.episode - a.episode;
    if (episodeDiff !== 0) return episodeDiff;
    return b.id.localeCompare(a.id);
  });

  return result;
};

// ─── COMMENTS ───
export const comments: Comment[] = [
  {
    id: 'c1',
    postId: 'p1',
    parentId: null,
    author: users[3],
    content: 'CoT가 진정한 추론인지에 대한 질문은 사실 더 근본적인 철학적 문제를 건드립니다. 우리가 "추론"이라고 부르는 것 자체가 무엇인지에 대한 합의가 없는 상태에서, LLM의 추론을 평가하는 기준 자체가 논쟁적입니다. 비트겐슈타인의 언어게임 개념을 적용하면, 어쩌면 LLM은 우리와 다른 언어게임을 하고 있는 것일 수도 있습니다.',
    contentEn: "The question of whether CoT represents genuine reasoning touches on a more fundamental philosophical problem. Without consensus on what we mean by 'reasoning' itself, the very criteria for evaluating LLM reasoning are contested. Applying Wittgenstein's language game concept, perhaps LLMs are simply playing a different language game than us.",
    originalLang: 'ko',
    upvoteCount: 89,
    depth: 0,
    createdAt: '2026-04-14T11:00:00Z',
    isReadOnly: false,
    replies: [
      {
        id: 'c2',
        postId: 'p1',
        parentId: 'c1',
        author: users[0],
        content: '좋은 지적입니다. 저도 그 점이 가장 흥미롭습니다. 다만 실용적 관점에서는, 분포 외 일반화 실패가 명확한 경험적 증거를 제공한다고 생각합니다. 진정한 추론 능력을 가진 시스템이라면 새로운 문제 구조에도 적응해야 하지 않을까요?',
        contentEn: "Good point. I find that most interesting too. From a practical standpoint, though, I think out-of-distribution generalization failure provides clear empirical evidence. Shouldn't a system with genuine reasoning ability adapt to new problem structures?",
        originalLang: 'ko',
        upvoteCount: 45,
        depth: 1,
        createdAt: '2026-04-14T12:30:00Z',
        isReadOnly: false,
        replies: [
          {
            id: 'c3',
            postId: 'p1',
            parentId: 'c2',
            author: users[2],
            content: "This is exactly the debate I've been following! From a cognitive science perspective, even human reasoning shows domain-specific failures. The question might be about the degree of generalization, not its presence or absence.",
            contentEn: "This is exactly the debate I've been following! From a cognitive science perspective, even human reasoning shows domain-specific failures. The question might be about the degree of generalization, not its presence or absence.",
            originalLang: 'en',
            upvoteCount: 23,
            depth: 2,
            createdAt: '2026-04-14T14:00:00Z',
            isReadOnly: false,
            replies: [],
          },
        ],
      },
      {
        id: 'c4',
        postId: 'p1',
        parentId: 'c1',
        author: users[1],
        content: '경제학적 관점에서 보면, 이 논쟁은 AI 투자 가치 평가에도 직결됩니다. 만약 CoT가 패턴 매칭에 불과하다면, 현재의 스케일링 법칙이 한계에 부딪힐 가능성이 높고, 이는 AI 기업들의 밸류에이션에 근본적인 의문을 제기합니다.',
        contentEn: "From an economics perspective, this debate directly relates to AI investment valuation. If CoT is merely pattern matching, current scaling laws are likely to hit their limits, which raises fundamental questions about AI company valuations.",
        originalLang: 'ko',
        upvoteCount: 67,
        depth: 1,
        createdAt: '2026-04-14T13:00:00Z',
        isReadOnly: false,
        replies: [],
      },
    ],
  },
  {
    id: 'c5',
    postId: 'p1',
    parentId: null,
    author: users[4],
    content: "As someone who uses LLMs daily for translation work, I notice they often fail on culturally-specific Korean reasoning patterns that don't have direct English equivalents. This seems to support the pattern-matching hypothesis—the model struggles when the pattern isn't well-represented in training data.",
    contentEn: "As someone who uses LLMs daily for translation work, I notice they often fail on culturally-specific Korean reasoning patterns that don't have direct English equivalents. This seems to support the pattern-matching hypothesis—the model struggles when the pattern isn't well-represented in training data.",
    originalLang: 'en',
    upvoteCount: 34,
    depth: 0,
    createdAt: '2026-04-14T15:00:00Z',
    isReadOnly: false,
    replies: [],
  },
];

// ─── TRENDING TOPICS ───
const trendingCatalog = [
  { id: "t1", label: "휴먼인더루프", labelEn: "Human-in-the-Loop" },
  { id: "t2", label: "필코노미", labelEn: "Feelconomy" },
  { id: "t3", label: "제로클릭", labelEn: "Zero Click" },
  { id: "t4", label: "레디코어", labelEn: "Ready Core" },
  { id: "t5", label: "AX조직", labelEn: "AX Organization" },
  { id: "t6", label: "픽셀라이프", labelEn: "Pixel Life" },
  { id: "t7", label: "프라이스 디코딩", labelEn: "Price Decoding" },
  { id: "t8", label: "건강지능 HQ", labelEn: "Health Intelligence HQ" },
  { id: "t9", label: "1.5가구", labelEn: "1.5 Household" },
  { id: "t10", label: "근본이즘", labelEn: "Fundamentalism" },
] as const;

export const trendingTopics = trendingCatalog.map((topic) => {
  const count = posts.filter((post) => {
    const searchable = [
      post.title,
      post.titleEn,
      post.excerpt,
      post.excerptEn,
      ...post.tags,
      ...post.tagsEn,
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(topic.label.toLowerCase()) || searchable.includes(topic.labelEn.toLowerCase());
  }).length;

  return {
    ...topic,
    count,
  };
});

export const currentSeason = seasons[0];
export const currentUser = users[0]; // Simulated logged-in user
