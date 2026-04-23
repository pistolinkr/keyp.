/*
 * KEYP. POST DETAIL PAGE
 * Design: Sharp Editorial Intelligence
 * Layout: Centered content (680px) + Floating AI Panel (right)
 * Features: Dual-language toggle (no layout shift), Comment thread, AI assistant
 */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PLACEHOLDER_AVATAR } from "@/lib/mockData";
import type { Comment, Post } from "@/lib/mockData";
import { getPostById, getCommentsForPost, incrementArticleViewCount } from "@/lib/contentApi";
import {
  createArticleComment,
  getEngagementState,
  subscribeArticleEngagement,
  toggleArticleBookmark,
  toggleArticleUpvote,
} from "@/lib/engagementApi";
import { requestAiAssistant } from "@/lib/aiApi";
import { formatPostedAgo } from "@/lib/postMeta";
import {
  ArrowUp, MessageSquare, Bookmark, Clock, Eye, Share2,
  ChevronLeft, Sparkles, X, Send, ArrowDown, ChevronRight,
  Star, CornerDownRight, Globe
} from "lucide-react";
import { toast } from "sonner";

function useCommentComposerIdentity() {
  const { user } = useAuth();
  const md = user?.userMetadata;
  const avatar =
    typeof md?.avatar_url === "string"
      ? md.avatar_url
      : PLACEHOLDER_AVATAR;
  const displayName =
    (typeof md?.full_name === "string" && md.full_name) ||
    (typeof md?.name === "string" && md.name) ||
    user?.email?.split("@")[0] ||
    "Guest";
  return { avatar, displayName };
}

// ─── COMMENT COMPONENT ───
function CommentItem({
  comment,
  lang,
  depth = 0,
}: {
  comment: Comment;
  lang: 'ko' | 'en';
  depth?: number;
}) {
  const { avatar: composerAvatar, displayName: composerName } = useCommentComposerIdentity();
  const [upvoted, setUpvoted] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const depthLineStyles = [
    { line: 'bg-primary/60', border: 'border-primary/60' },
    { line: 'bg-primary/40', border: 'border-primary/40' },
    { line: 'bg-primary/25', border: 'border-primary/25' },
    { line: 'bg-primary/15', border: 'border-primary/15' },
  ];
  const depthStyle = depthLineStyles[Math.min(depth - 1, 3)];

  return (
    <div className={`relative ${depth > 0 ? 'pl-5' : ''}`}>
      {depth > 0 && (
        <>
          <span
            aria-hidden
            className={`absolute left-[6px] top-0 bottom-0 w-px ${depthStyle.line}`}
          />
          <span
            aria-hidden
            className={`absolute left-[6px] top-[17px] h-[8px] w-[10px] border-l border-b rounded-bl-sm ${depthStyle.border}`}
          />
        </>
      )}
      <div className="py-3">
        {/* Comment header */}
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/profile/${comment.author.username}`}>
            <img
              src={comment.author.avatar}
              alt={comment.author.displayName}
              className="w-6 h-6 object-cover border border-border cursor-pointer"
            />
          </Link>
          <Link href={`/profile/${comment.author.username}`}>
            <span className="text-xs font-semibold hover:text-primary transition-colors cursor-pointer">
              {lang === 'ko' ? comment.author.displayName : comment.author.displayNameEn}
            </span>
          </Link>
          {comment.author.isVerified && (
            <span className="text-primary text-xs">✓</span>
          )}
          <span className="font-mono text-xs text-muted-foreground">Lv.{comment.author.level}</span>
          <span className="font-mono text-xs text-muted-foreground border border-border px-1">
            {comment.originalLang.toUpperCase()}
          </span>
          <span className="font-mono text-xs text-muted-foreground ml-auto">
            {new Date(comment.createdAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
              month: 'short', day: 'numeric'
            })}
          </span>
          {comment.replies && comment.replies.length > 0 && (
            <button
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? `[+${comment.replies!.length}]` : '[-]'}
            </button>
          )}
        </div>

        {/* Comment body */}
        {!collapsed && (
          <div className="ml-8">
            <p className="text-sm leading-relaxed text-foreground mb-2">
              {lang === 'ko' ? comment.content : comment.contentEn}
            </p>

            {/* Comment actions */}
            <div className="flex items-center gap-3">
              <button
                className={`flex items-center gap-1 text-xs transition-colors ${
                  upvoted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setUpvoted(!upvoted)}
              >
                <ArrowUp size={12} />
                <span className="font-mono">{comment.upvoteCount + (upvoted ? 1 : 0)}</span>
              </button>
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowReply(!showReply)}
              >
                <CornerDownRight size={12} />
                {lang === 'ko' ? '답글' : 'Reply'}
              </button>
              {comment.isReadOnly && (
                <span className="font-mono text-xs text-muted-foreground border border-border px-1.5 py-0.5">
                  READ-ONLY
                </span>
              )}
            </div>

            {/* Reply input */}
            {showReply && (
              <div className="mt-3 flex gap-2">
                <img
                  src={composerAvatar}
                  alt={composerName}
                  className="w-6 h-6 object-cover border border-border shrink-0 mt-0.5"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder={lang === 'ko' ? '답글을 입력하세요...' : 'Write a reply...'}
                    className="flex-1 bg-muted border border-border px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    className="keyp-btn-primary px-3 py-1.5 text-xs"
                    onClick={() => {
                      toast(lang === 'ko' ? '답글이 등록되었습니다' : 'Reply posted');
                      setShowReply(false);
                    }}
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nested replies */}
      {!collapsed && comment.replies && comment.replies.length > 0 && (
        <div className="ml-5">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} lang={lang} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI PANEL ───
function AIPanel({
  onClose,
  lang,
  postTitle,
  postContent,
}: {
  onClose: () => void;
  lang: 'ko' | 'en';
  postTitle: string;
  postContent: string;
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    {
      role: 'ai',
      text: lang === 'ko'
        ? '안녕하세요! 이 글 문맥에 맞춰 핵심 요약, 논리 점검, 표현 개선 제안을 도와드릴게요.'
        : "Hello! I can help with context-aware summary, logic checks, and writing improvements for this article.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const history: Array<{ role: "user" | "assistant"; text: string }> = messages
        .slice(-6)
        .map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          text: m.text,
        }));
      const { reply } = await requestAiAssistant({
        message: userMsg,
        title: postTitle,
        content: postContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        lang,
        history,
      });
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          text:
            lang === "ko"
              ? `AI 응답 실패: ${error?.message ?? "알 수 없는 오류"}`
              : `AI response failed: ${error?.message ?? "Unknown error"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full keyp-ai-panel animate-slide-in-right">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-primary" />
          <span className="text-sm font-semibold">
            {lang === 'ko' ? 'AI 어시스턴트' : 'AI Assistant'}
          </span>
          <span className="font-mono text-xs text-muted-foreground border border-border px-1.5 py-0.5">
            BETA
          </span>
        </div>
        <button
          className="p-1 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X size={15} />
        </button>
      </div>

      {/* Notice */}
      <div className="px-4 py-2 bg-muted/50 border-b border-border">
        <p className="font-mono text-xs text-muted-foreground">
          {lang === 'ko'
            ? '⚠ AI 제안은 자동 반영되지 않습니다. Apply 버튼으로만 적용됩니다.'
            : '⚠ AI suggestions are not auto-applied. Use the Apply button only.'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' && (
              <div className="w-6 h-6 bg-primary flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted text-foreground'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 bg-primary flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-primary-foreground animate-pulse" />
            </div>
            <div className="bg-muted px-3 py-2 text-xs text-muted-foreground">
              {lang === 'ko' ? '생각 중...' : 'Thinking...'}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={lang === 'ko' ? '질문을 입력하세요...' : 'Ask a question...'}
            className="flex-1 bg-muted border border-border px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
          />
          <button
            className="keyp-btn-primary px-3 py-2"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            <Send size={13} />
          </button>
        </div>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          {lang === 'ko' ? 'Ollama 로컬 AI' : 'Ollama Local AI'}
        </p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───
interface PostDetailPageProps {
  id: string;
}

export default function PostDetailPage({ id }: PostDetailPageProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isLocalDevUser = user?.isLocalDev === true;
  const { lang: globalLang } = useLanguage();
  const [lang, setLang] = useState<'ko' | 'en'>(globalLang);
  const [langTransitioning, setLangTransitioning] = useState(false);
  const [hasLocalLanguageOverride, setHasLocalLanguageOverride] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [detailLoading, setDetailLoading] = useState(true);
  const { avatar: composerAvatar, displayName: composerDisplayName } = useCommentComposerIdentity();

  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    setPost(null);
    setPostComments([]);
    (async () => {
      const [p, c, state] = await Promise.all([
        getPostById(id),
        getCommentsForPost(id),
        getEngagementState(id),
      ]);
      if (cancelled) return;
      setPost(p);
      setPostComments(c);
      if (state.ok) {
        setUpvoted(state.upvoted);
        setBookmarked(state.bookmarked);
      } else {
        setUpvoted(false);
        setBookmarked(false);
      }
      setDetailLoading(false);

      if (p?.id) {
        const next = await incrementArticleViewCount(p.id);
        if (!cancelled && typeof next === "number") {
          setPost((prev) => (prev ? { ...prev, viewCount: next } : prev));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const unsubscribe = subscribeArticleEngagement(id, () => {
      void (async () => {
        const [latestPost, latestComments, state] = await Promise.all([
          getPostById(id),
          getCommentsForPost(id),
          getEngagementState(id),
        ]);
        setPost(latestPost);
        setPostComments(latestComments);
        if (state.ok) {
          setUpvoted(state.upvoted);
          setBookmarked(state.bookmarked);
        }
      })();
    });
    return () => {
      unsubscribe?.();
    };
  }, [id]);

  // Reading progress
  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const progress = Math.min(100, Math.max(0,
        ((window.innerHeight - rect.top) / (rect.height + window.innerHeight)) * 100
      ));
      setReadProgress(progress);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reflect story progress on the native page scrollbar.
  useEffect(() => {
    document.body.classList.add("story-progress-scrollbar");
    return () => {
      document.body.classList.remove("story-progress-scrollbar");
      document.body.style.removeProperty("--story-read-progress");
    };
  }, []);

  useEffect(() => {
    document.body.style.setProperty("--story-read-progress", `${readProgress}%`);
  }, [readProgress]);

  // Language transition (no layout shift)
  const handleLangChange = (newLang: 'ko' | 'en') => {
    if (newLang === lang) return;
    setHasLocalLanguageOverride(true);
    setLangTransitioning(true);
    setTimeout(() => {
      setLang(newLang);
      setLangTransitioning(false);
    }, 150);
  };

  // Sync with nav language only until user explicitly overrides locally.
  useEffect(() => {
    if (hasLocalLanguageOverride) return;
    if (globalLang === lang) return;
    setLangTransitioning(true);
    const timer = window.setTimeout(() => {
      setLang(globalLang);
      setLangTransitioning(false);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [globalLang, hasLocalLanguageOverride, lang]);

  // New report page starts from nav language again.
  useEffect(() => {
    setHasLocalLanguageOverride(false);
    setLang(globalLang);
  }, [id]);

  if (detailLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <p className="font-mono text-sm text-muted-foreground">
          {globalLang === "ko" ? "불러오는 중…" : "Loading…"}
        </p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground mb-6">
          {globalLang === "ko" ? "글을 찾을 수 없습니다." : "Post not found."}
        </p>
        <Link href="/feed">
          <span className="text-sm text-primary hover:underline cursor-pointer">
            {globalLang === "ko" ? "피드로 돌아가기" : "Back to feed"}
          </span>
        </Link>
      </div>
    );
  }

  const diff = { beginner: { ko: '입문', en: 'Beginner' }, intermediate: { ko: '중급', en: 'Intermediate' }, advanced: { ko: '심화', en: 'Advanced' } }[post.difficulty];
  const canEditPost = Boolean(user?.id && !isLocalDevUser && post.authorProfileId === user.id);

  return (
    <div className="relative">
      <div className="flex">
        {/* ─── ARTICLE ─── */}
        <div className={`flex-1 min-w-0 transition-all duration-200 ${showAI ? 'mr-0' : ''}`}>
          <div className="max-w-2xl mx-auto px-6 py-10">
            {/* Back navigation */}
            <Link href="/feed">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 cursor-pointer w-fit">
                <ChevronLeft size={16} />
                {globalLang === 'ko' ? '피드로 돌아가기' : 'Back to Feed'}
              </div>
            </Link>

            {/* Article header */}
            <header className="mb-8">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">
                  {lang === 'ko' ? post.category : post.categoryEn}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {lang === 'ko' ? diff.ko : diff.en}
                </span>
                {post.isFeatured && (
                  <span className="flex items-center gap-1 font-mono text-xs text-amber-600 dark:text-amber-400">
                    <Star size={10} fill="currentColor" />
                    {lang === 'ko' ? '추천' : 'Featured'}
                  </span>
                )}
              </div>

              {/* Title — no layout shift on lang change */}
              <div className="relative mb-4" style={{ minHeight: '80px' }}>
                <h1
                  className={`text-3xl md:text-4xl font-black leading-tight text-foreground transition-opacity duration-150 ${langTransitioning ? 'opacity-0' : 'opacity-100'}`}
                  style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.03em' }}
                >
                  {lang === 'ko' ? post.title : post.titleEn}
                </h1>
              </div>

              {/* Language toggle */}
              <div className="flex items-center gap-3 mb-6">
                <div className="keyp-lang-toggle">
                  <button
                    className={lang === 'ko' ? 'active' : ''}
                    onClick={() => handleLangChange('ko')}
                  >
                    {lang === 'ko' ? '원문 (KO)' : 'Original (KO)'}
                  </button>
                  <button
                    className={lang === 'en' ? 'active' : ''}
                    onClick={() => handleLangChange('en')}
                  >
                    English
                  </button>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe size={12} />
                  <span className="font-mono">
                    {lang === 'ko'
                      ? `원문: ${post.originalLang === 'ko' ? '한국어' : 'English'}`
                      : `Original: ${post.originalLang === 'ko' ? 'Korean' : 'English'}`}
                  </span>
                </div>
              </div>

              {/* Author & stats */}
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <Link href={`/profile/${post.author.username}`}>
                  <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
                    <img
                      src={post.author.avatar}
                      alt={post.author.displayName}
                      className="w-9 h-9 object-cover border border-border"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">
                          {lang === 'ko' ? post.author.displayName : post.author.displayNameEn}
                        </span>
                        {post.author.isVerified && (
                          <span className="text-primary text-xs">✓</span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        Lv.{post.author.level} · {post.seasonId.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex-1" />

                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="keyp-post-meta flex items-center gap-1">
                    <Clock size={12} />
                    {formatPostedAgo(post.createdAt, lang)}
                  </span>
                  <span className="keyp-post-meta flex items-center gap-1">
                    <Eye size={12} />
                    {post.viewCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </header>

            {/* Article content */}
            <div
              ref={contentRef}
              className={`prose-keyp transition-opacity duration-150 ${langTransitioning ? 'opacity-0' : 'opacity-100'}`}
              dangerouslySetInnerHTML={{
                __html: (lang === 'ko' ? post.content : post.contentEn)
                  .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                  .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/^/, '<p>')
                  .replace(/$/, '</p>')
                  .replace(/<p><h/g, '<h')
                  .replace(/<\/h([23])><\/p>/g, '</h$1>')
              }}
            />

            {/* Tags */}
            <div className="mt-10 pt-6 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {(lang === 'ko' ? post.tags : post.tagsEn).map((tag) => (
                  <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                    <span className="font-mono text-xs border border-border px-2.5 py-1 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Action bar */}
            <div className="mt-6 flex items-center gap-3 py-4 border-y border-border">
              <button
                className={`flex items-center gap-1.5 px-4 py-2 border transition-colors text-sm font-medium ${
                  upvoted
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
                onClick={async () => {
                  if (!post || engagementLoading) return;
                  setEngagementLoading(true);
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
                    setEngagementLoading(false);
                    return;
                  }
                  setUpvoted(state.upvoted);
                  setPost((prev) =>
                    prev
                      ? {
                          ...prev,
                          upvoteCount: state.counters.upvotes,
                          commentCount: state.counters.comments,
                          bookmarkCount: state.counters.bookmarks,
                        }
                      : prev,
                  );
                  setEngagementLoading(false);
                }}
                disabled={engagementLoading}
              >
                <ArrowUp size={15} />
                {post.upvoteCount}
              </button>

              <a href="#comments">
                <button className="flex items-center gap-1.5 px-4 py-2 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors text-sm">
                  <MessageSquare size={15} />
                  {post.commentCount}
                </button>
              </a>

              <button
                className={`flex items-center gap-1.5 px-4 py-2 border transition-colors text-sm ${
                  bookmarked
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
                onClick={async () => {
                  if (!post || engagementLoading) return;
                  setEngagementLoading(true);
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
                    setEngagementLoading(false);
                    return;
                  }
                  setBookmarked(state.bookmarked);
                  setPost((prev) =>
                    prev
                      ? {
                          ...prev,
                          upvoteCount: state.counters.upvotes,
                          commentCount: state.counters.comments,
                          bookmarkCount: state.counters.bookmarks,
                        }
                      : prev,
                  );
                  toast(state.bookmarked ? (lang === "ko" ? "북마크 저장됨" : "Bookmarked") : (lang === "ko" ? "북마크 해제" : "Bookmark removed"));
                  setEngagementLoading(false);
                }}
                disabled={engagementLoading}
              >
                <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>

              <button
                className="flex items-center gap-1.5 px-4 py-2 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast(lang === 'ko' ? '링크가 복사되었습니다' : 'Link copied');
                }}
              >
                <Share2 size={15} />
              </button>

              {canEditPost && (
                <button
                  className="flex items-center gap-1.5 px-4 py-2 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm"
                  onClick={() => setLocation(`/write?edit=${encodeURIComponent(post.id)}`)}
                >
                  {lang === "ko" ? "수정" : "Edit"}
                </button>
              )}

              <div className="flex-1" />

              {/* AI toggle */}
              <button
                className={`flex items-center gap-1.5 px-4 py-2 border transition-colors text-sm ${
                  showAI
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
                onClick={() => setShowAI(!showAI)}
              >
                <Sparkles size={15} />
                {lang === 'ko' ? 'AI 어시스턴트' : 'AI Assistant'}
              </button>
            </div>

            {/* ─── COMMENTS ─── */}
            <section id="comments" className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Noto Sans KR' }}>
                  {lang === 'ko' ? `댓글 ${post.commentCount}개` : `${post.commentCount} Comments`}
                </h2>
                <div className="flex items-center gap-1">
                  {(['best', 'latest'] as const).map((s) => (
                    <button
                      key={s}
                      className="font-mono text-xs px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                    >
                      {s === 'best' ? (lang === 'ko' ? '베스트' : 'BEST') : (lang === 'ko' ? '최신' : 'LATEST')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment input */}
              {!post.isReadOnly ? (
                <div className="flex gap-3 mb-6 pb-6 border-b border-border">
                  <img
                    src={composerAvatar}
                    alt={composerDisplayName}
                    className="w-8 h-8 object-cover border border-border shrink-0"
                  />
                  <div className="flex-1">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder={lang === 'ko' ? '댓글을 작성하세요...' : 'Write a comment...'}
                      className="w-full bg-muted border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                      rows={3}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {lang === 'ko' ? '마크다운 지원' : 'Markdown supported'}
                      </span>
                      <button
                        className="keyp-btn-primary flex items-center gap-1.5 text-xs px-4 py-2"
                        onClick={async () => {
                          if (!post || engagementLoading || !commentInput.trim()) return;
                          setEngagementLoading(true);
                          const result = await createArticleComment({
                            articleId: post.id,
                            content: commentInput,
                            locale: lang,
                          });
                          if (!result.ok) {
                            if (result.error === "not_authenticated") {
                              if (isLocalDevUser) {
                                toast(
                                  lang === "ko"
                                    ? "로컬 개발 로그인 상태에서는 댓글을 작성할 수 없습니다. 이메일 로그인으로 전환해 주세요."
                                    : "Comments are unavailable in local-dev login mode. Sign in with email.",
                                );
                              } else {
                                toast(lang === "ko" ? "댓글 기능은 로그인 후 사용할 수 있습니다." : "Sign in to post comments.");
                              }
                            } else {
                              toast(lang === "ko" ? "댓글 등록 실패" : "Failed to post comment");
                            }
                            setEngagementLoading(false);
                            return;
                          }

                          const [latestPost, latestComments] = await Promise.all([
                            getPostById(post.id),
                            getCommentsForPost(post.id),
                          ]);
                          setPost(latestPost);
                          setPostComments(latestComments);
                          setCommentInput("");
                          toast(lang === 'ko' ? '댓글이 등록되었습니다' : 'Comment posted');
                          setEngagementLoading(false);
                        }}
                        disabled={!commentInput.trim() || engagementLoading}
                      >
                        <Send size={12} />
                        {lang === 'ko' ? '등록' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-6 p-3 bg-muted border border-border">
                  <span className="font-mono text-xs text-muted-foreground">
                    {lang === 'ko'
                      ? '이 글은 읽기 전용입니다. 댓글을 작성할 수 없습니다.'
                      : 'This post is read-only. Comments are disabled.'}
                  </span>
                </div>
              )}

              {/* Comment threads */}
              <div className="space-y-0">
                {postComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    {lang === 'ko' ? '첫 번째 댓글을 작성해보세요' : 'Be the first to comment'}
                  </p>
                ) : (
                  postComments.map((comment) => (
                    <div key={comment.id} className="border-b border-border">
                      <CommentItem comment={comment} lang={lang} depth={0} />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        {/* ─── AI PANEL ─── */}
        {showAI && (
          <div className="hidden lg:flex flex-col w-80 shrink-0 sticky top-[4.5rem] h-[calc(100vh-72px)] border-l border-border">
            <AIPanel
              onClose={() => setShowAI(false)}
              lang={lang}
              postTitle={lang === "ko" ? post.title : post.titleEn}
              postContent={lang === "ko" ? post.content : post.contentEn}
            />
          </div>
        )}
      </div>
    </div>
  );
}
