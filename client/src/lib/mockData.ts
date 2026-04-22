// ─── KEYP. DATA LAYER ───
// Minimal local shapes; published content comes from Supabase when configured.

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
  originalLang: "ko" | "en";
  readTime: number;
  viewCount: number;
  upvoteCount: number;
  commentCount: number;
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
  isReadOnly: boolean;
  isFeatured: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  author: User;
  content: string;
  contentEn: string;
  originalLang: "ko" | "en";
  upvoteCount: number;
  depth: number;
  createdAt: string;
  isReadOnly: boolean;
  replies?: Comment[];
}

/** Avatar used when no user or profile image is available. */
export const PLACEHOLDER_AVATAR =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&h=80&fit=crop";

const UNKNOWN_AUTHOR: User = {
  id: "unknown",
  username: "unknown",
  displayName: "알 수 없음",
  displayNameEn: "Unknown",
  avatar: PLACEHOLDER_AVATAR,
  bio: "",
  bioEn: "",
  level: 0,
  xp: 0,
  joinedSeason: "",
  postCount: 0,
  commentCount: 0,
    isVerified: false,
  tags: [],
};

export const seasons: Season[] = [];
export const users: User[] = [];

export const categoryCatalog = [
  { id: "tech", label: "기술", labelEn: "Technology" },
  { id: "science", label: "과학", labelEn: "Science" },
  { id: "economics", label: "경제", labelEn: "Economics" },
  { id: "philosophy", label: "철학", labelEn: "Philosophy" },
  { id: "culture", label: "문화", labelEn: "Culture" },
  { id: "language", label: "언어", labelEn: "Language" },
  { id: "history", label: "역사", labelEn: "History" },
  { id: "society", label: "사회", labelEn: "Society" },
] as const;

const articleSeedPosts: Post[] = [];

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
const categoryById = new Map<string, (typeof categoryCatalog)[number]>(
  categoryCatalog.map((c) => [c.id, c]),
);

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
    const author = userById.get(article.author) ?? UNKNOWN_AUTHOR;

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

export const comments: Comment[] = [];

const trendingCatalog = [
  { id: "t1", label: "휴먼인더루프", labelEn: "Human-in-the-Loop" },
  { id: "t2", label: "필코노미", labelEn: "Philconomy" },
  { id: "t3", label: "제로클릭", labelEn: "Zero-Click" },
  { id: "t4", label: "레디코어", labelEn: "Ready-Core" },
  { id: "t5", label: "AX조직", labelEn: "AX Organization" },
  { id: "t6", label: "픽셀라이프", labelEn: "Pixel Life" },
  { id: "t7", label: "프라이스 디코딩", labelEn: "Price Decoding" },
  { id: "t8", label: "건강지능 HQ", labelEn: "Health Intelligence HQ" },
  { id: "t9", label: "1.5가구", labelEn: "1.5 Household" },
  { id: "t10", label: "근본이즘", labelEn: "Back-to-Basics" },
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
