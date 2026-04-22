/*
 * KEYP. FEED PAGE
 * Design: Sharp Editorial Intelligence
 * Layout: Post list (no cards, divider-only) + Right sidebar context panel
 * Features: Category filter, Season filter, Sort options
 */
import { useCallback, useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { trendingTopics } from "@/lib/mockData";
import type { Post } from "@/lib/mockData";
import { deriveCategoriesFromPosts, getPublishedPosts } from "@/lib/contentApi";
import {
  getEngagementState,
  toggleArticleBookmark,
  toggleArticleUpvote,
} from "@/lib/engagementApi";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  ArrowUp, MessageSquare, Bookmark, Clock, Eye,
  ChevronRight, Filter, SlidersHorizontal, Star
} from "lucide-react";
import { toast } from "sonner";

const DIFFICULTY_LABELS = {
  beginner: { ko: '입문', en: 'Beginner', color: 'text-green-600 dark:text-green-400' },
  intermediate: { ko: '중급', en: 'Intermediate', color: 'text-amber-600 dark:text-amber-400' },
  advanced: { ko: '심화', en: 'Advanced', color: 'text-red-600 dark:text-red-400' },
};

const TRENDING_ORDER = trendingTopics.flatMap((topic, index) => [
  { keyword: topic.label.toLowerCase(), index },
  { keyword: topic.labelEn.toLowerCase(), index },
]);

function getTrendingRank(post: Post): number {
  const searchable = [
    post.title,
    post.titleEn,
    post.excerpt,
    post.excerptEn,
    ...post.tags,
    ...post.tagsEn,
  ].join(" ").toLowerCase();

  for (const item of TRENDING_ORDER) {
    if (searchable.includes(item.keyword)) {
      return item.index;
    }
  }
  return Number.MAX_SAFE_INTEGER;
}

function getPostTimestamp(post: Post): number {
  const created = Date.parse(post.createdAt);
  if (!Number.isNaN(created)) return created;

  const updated = Date.parse(post.updatedAt);
  if (!Number.isNaN(updated)) return updated;

  return 0;
}

function getPopularityScore(post: Post): number {
  // Upvotes are primary signal; views/comments are secondary tie-breakers.
  return post.upvoteCount * 1000 + post.commentCount * 10 + post.viewCount * 0.01;
}

function PostItem({
  post,
  lang,
  onOpenPost,
  onCountersUpdate,
}: {
  post: Post;
  lang: 'ko' | 'en';
  onOpenPost: (postId: string) => void;
  onCountersUpdate: (
    postId: string,
    counters: { upvotes: number; comments: number; bookmarks: number },
  ) => void;
}) {
  const { user } = useAuth();
  const isLocalDevUser = user?.isLocalDev === true;
  const [upvoted, setUpvoted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const diff = DIFFICULTY_LABELS[post.difficulty];
  const handleOpenBySectionClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, select, textarea, [role='button']")) {
      return;
    }
    onOpenPost(post.id);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await getEngagementState(post.id);
      if (cancelled || !state.ok) return;
      setUpvoted(state.upvoted);
      setBookmarked(state.bookmarked);
      onCountersUpdate(post.id, state.counters);
    })();
    return () => {
      cancelled = true;
    };
  }, [post.id, onCountersUpdate]);

  return (
    <article className="keyp-post-item" onClick={handleOpenBySectionClick}>
      <div className="flex gap-4">
        {/* Left: vote */}
        <div className="flex flex-col items-center gap-1 pt-0.5 min-w-[36px]">
          <button
            className={`flex flex-col items-center gap-0.5 p-1 hover:text-primary transition-colors ${upvoted ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={async () => {
              const state = await toggleArticleUpvote(post.id);
              if (!state.ok) {
                if (state.error === "not_authenticated") {
                  if (isLocalDevUser) {
                    toast(
                      lang === "ko"
                        ? "로컬 개발 로그인 상태에서는 추천 기능을 사용할 수 없습니다. 이메일 로그인으로 전환해 주세요."
                        : "Upvotes are unavailable in local-dev login mode. Sign in with email.",
                    );
                  } else {
                    toast(lang === "ko" ? "추천 기능은 로그인 후 사용할 수 있습니다." : "Sign in to use upvotes.");
                  }
                } else {
                  toast(lang === "ko" ? "추천 처리 실패" : "Failed to update upvote");
                }
                return;
              }
              setUpvoted(state.upvoted);
              onCountersUpdate(post.id, state.counters);
            }}
          >
            <ArrowUp size={16} strokeWidth={upvoted ? 2.5 : 2} />
            <span className="font-mono text-xs">{post.upvoteCount}</span>
          </button>
        </div>

        {/* Right: content */}
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">
              {lang === 'ko' ? post.category : post.categoryEn}
            </span>
            <span className={`font-mono text-xs ${diff.color}`}>
              {lang === 'ko' ? diff.ko : diff.en}
            </span>
            {post.isFeatured && (
              <span className="flex items-center gap-1 font-mono text-xs text-amber-600 dark:text-amber-400">
                <Star size={10} fill="currentColor" />
                {lang === 'ko' ? '추천' : 'Featured'}
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/post/${post.id}`}>
            <h2 className="keyp-post-title mb-2 cursor-pointer hover:text-primary transition-colors">
              {lang === 'ko' ? post.title : post.titleEn}
            </h2>
          </Link>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
            {lang === 'ko' ? post.excerpt : post.excerptEn}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(lang === 'ko' ? post.tags : post.tagsEn).map((tag) => (
              <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                <span className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  #{tag}
                </span>
              </Link>
            ))}
          </div>

          {/* Footer row */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Author */}
            <Link href={`/profile/${post.author.username}`}>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-5 h-5 object-cover border border-border"
                />
                <span className="text-xs font-medium">
                  {lang === 'ko' ? post.author.displayName : post.author.displayNameEn}
                </span>
                {post.author.isVerified && (
                  <span className="text-primary text-xs">✓</span>
                )}
              </div>
            </Link>

            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="keyp-post-meta flex items-center gap-1">
                <Clock size={11} />
                {post.readTime}min
              </span>
              <span className="keyp-post-meta flex items-center gap-1">
                <Eye size={11} />
                {post.viewCount.toLocaleString()}
              </span>
              <Link href={`/post/${post.id}#comments`}>
                <span className="keyp-post-meta flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                  <MessageSquare size={11} />
                  {post.commentCount}
                </span>
              </Link>
            </div>

            <div className="flex-1" />

            {/* Bookmark */}
            <button
              className={`p-1 transition-colors ${bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={async () => {
                const state = await toggleArticleBookmark(post.id);
                if (!state.ok) {
                  if (state.error === "not_authenticated") {
                    if (isLocalDevUser) {
                      toast(
                        lang === "ko"
                          ? "로컬 개발 로그인 상태에서는 북마크를 사용할 수 없습니다. 이메일 로그인으로 전환해 주세요."
                          : "Bookmarks are unavailable in local-dev login mode. Sign in with email.",
                      );
                    } else {
                      toast(lang === "ko" ? "북마크 기능은 로그인 후 사용할 수 있습니다." : "Sign in to use bookmarks.");
                    }
                  } else {
                    toast(lang === "ko" ? "북마크 처리 실패" : "Failed to update bookmark");
                  }
                  return;
                }
                setBookmarked(state.bookmarked);
                onCountersUpdate(post.id, state.counters);
                toast(state.bookmarked ? (lang === "ko" ? "북마크 저장됨" : "Bookmarked") : (lang === "ko" ? "북마크 해제" : "Bookmark removed"));
              }}
            >
              <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>

            {/* Lang indicator */}
            <span className="font-mono text-xs text-muted-foreground border border-border px-1.5 py-0.5">
              {post.originalLang.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FeedPage() {
  const { lang } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState(() => deriveCategoriesFromPosts([]));
  const [feedLoading, setFeedLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'trending' | 'top'>('latest');
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFeedLoading(true);
      try {
        const postList = await getPublishedPosts();
        if (cancelled) return;
        setPosts(postList);
        setCategories(deriveCategoriesFromPosts(postList));
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const syncSortForViewport = () => {
      setShowRightPanel(media.matches);
      if (media.matches && sortBy === "trending") {
        setSortBy("latest");
      }
    };

    syncSortForViewport();
    media.addEventListener("change", syncSortForViewport);
    return () => media.removeEventListener("change", syncSortForViewport);
  }, [sortBy]);

  useEffect(() => {
    const syncCategoryFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const categoryFromUrl = params.get("category");
      setActiveCategory(categoryFromUrl || "all");
    };

    syncCategoryFromUrl();
    window.addEventListener("popstate", syncCategoryFromUrl);
    return () => window.removeEventListener("popstate", syncCategoryFromUrl);
  }, []);

  useEffect(() => {
    document.body.classList.add("feed-scrollbar-neutral");
    return () => document.body.classList.remove("feed-scrollbar-neutral");
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = supabase
      .channel("feed-engagement")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "articles" },
        ({ new: row }: { new: any }) => {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === row.id
                ? {
                    ...p,
                    upvoteCount: row.upvote_count ?? p.upvoteCount,
                    commentCount: row.comment_count ?? p.commentCount,
                    bookmarkCount: row.bookmark_count ?? p.bookmarkCount,
                    updatedAt: row.updated_at ?? p.updatedAt,
                  }
                : p,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleCountersUpdate = useCallback((
    postId: string,
    counters: { upvotes: number; comments: number; bookmarks: number },
  ) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              upvoteCount: counters.upvotes,
              commentCount: counters.comments,
              bookmarkCount: counters.bookmarks,
            }
          : post,
      ),
    );
  }, []);

  const filteredPosts = posts.filter(p => {
    if (activeCategory !== 'all') {
      const cat = categories.find(c => c.id === activeCategory);
      if (cat && p.category !== cat.label) return false;
    }
    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'trending') {
      const rankDiff = getTrendingRank(a) - getTrendingRank(b);
      if (rankDiff !== 0) return rankDiff;
      const viewDiff = b.viewCount - a.viewCount;
      if (viewDiff !== 0) return viewDiff;
    } else if (sortBy === 'top') {
      const upvoteDiff = b.upvoteCount - a.upvoteCount;
      if (upvoteDiff !== 0) return upvoteDiff;
      const popularityDiff = getPopularityScore(b) - getPopularityScore(a);
      if (popularityDiff !== 0) return popularityDiff;
    } else {
      const timeDiff = getPostTimestamp(b) - getPostTimestamp(a);
      if (timeDiff !== 0) return timeDiff;
    }

    // Deterministic fallback order to avoid "shuffled" feeling on ties.
    const episodeDiff = b.episode - a.episode;
    if (episodeDiff !== 0) return episodeDiff;
    return b.id.localeCompare(a.id);
  });

  return (
    <div className="flex min-h-screen">
      {/* ─── MAIN FEED ─── */}
      <div className="relative flex-1 min-w-0 xl:before:content-[''] xl:before:absolute xl:before:right-0 xl:before:top-0 xl:before:h-full xl:before:w-[0.5px] xl:before:bg-border">
        {/* Feed header */}
        <div className="sticky top-[4.5rem] z-30 bg-background border-b border-border">
          {/* Category tabs */}
          <div className="flex items-center gap-0 overflow-x-auto px-6 pt-4 pb-0">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                window.history.pushState({}, "", "/feed");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
            >
              {lang === 'ko' ? '전체' : 'All'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => {
                  window.history.pushState({}, "", `/feed?category=${encodeURIComponent(cat.id)}`);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
              >
                {lang === 'ko' ? cat.label : cat.labelEn}
              </button>
            ))}
          </div>

          {/* Sort & Filter bar */}
          <div className="flex items-center gap-3 px-6 py-2.5 border-t border-border">
            <div className="flex items-center gap-1">
              {(['latest', 'trending', 'top'] as const).map((s) => (
                <button
                  key={s}
                  className={`${s === 'trending' ? 'xl:hidden ' : ''}px-3 py-1 font-mono text-xs transition-colors ${
                    sortBy === s
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setSortBy(s)}
                >
                  {s === 'latest' ? (lang === 'ko' ? '최신' : 'LATEST') :
                   s === 'trending' ? (lang === 'ko' ? '트렌딩' : 'TRENDING') :
                   (lang === 'ko' ? '인기' : 'TOP')}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <button
              className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              onClick={() => toast('필터 기능 — 준비 중입니다')}
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Post list */}
        <div className="px-6">
          {feedLoading ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground font-mono text-sm">
                {lang === "ko" ? "불러오는 중…" : "Loading…"}
              </p>
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">{lang === 'ko' ? '게시글이 없습니다' : 'No posts found'}</p>
            </div>
          ) : (
            sortedPosts.map((post, i) => (
              <div
                key={post.id}
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'forwards' }}
              >
                <PostItem
                  post={post}
                  lang={lang}
                  onOpenPost={(postId) => setLocation(`/post/${postId}`)}
                  onCountersUpdate={handleCountersUpdate}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── RIGHT CONTEXT PANEL ─── */}
      <aside
        className={`flex flex-col shrink-0 sticky top-[4.5rem] h-[calc(100vh-72px)] overflow-hidden transition-all duration-300 ease-out ${
          showRightPanel ? "w-80 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-8 pointer-events-none"
        }`}
      >
        <div
          className={`p-5 space-y-6 transition-all duration-300 ease-out ${
            showRightPanel ? "opacity-100 translate-x-0 blur-0" : "opacity-0 translate-x-6 blur-[2px]"
          }`}
        >
          {/* Trending topics */}
          <div>
            <p className="keyp-section-label mb-3">TRENDING NOW</p>
            <div className="space-y-0">
              {trendingTopics.map((topic, i) => (
                <Link key={topic.id} href={`/search?q=${encodeURIComponent(topic.label)}`}>
                  <div className="flex items-center gap-3 py-2.5 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer group px-1">
                    <span className="font-mono text-xs text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-sm flex-1 group-hover:text-primary transition-colors">
                      {lang === 'ko' ? topic.label : topic.labelEn}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{topic.count}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Write CTA */}
          <div className="border border-border p-4">
            <p className="text-sm font-medium mb-2">
              {lang === 'ko' ? '지식을 나눠보세요' : 'Share Your Knowledge'}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {lang === 'ko'
                ? '글을 작성하고 커뮤니티와 함께 성장하세요.'
                : 'Write posts and grow with the community.'}
            </p>
            <Link href="/write">
              <button className="keyp-btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
                {lang === 'ko' ? '글 작성하기' : 'Start Writing'}
                <ChevronRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
