/*
 * KEYP. POST DETAIL PAGE
 * Design: Sharp Editorial Intelligence
 * Layout: Centered content (680px) + Floating AI Panel (right)
 * Features: Dual-language toggle (no layout shift), Comment thread, AI assistant
 */
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { posts, comments, currentUser } from "@/lib/mockData";
import type { Comment } from "@/lib/mockData";
import {
  ArrowUp, MessageSquare, Bookmark, Clock, Eye, Share2,
  ChevronLeft, Sparkles, X, Send, ArrowDown, ChevronRight,
  Star, CornerDownRight, Globe
} from "lucide-react";
import { toast } from "sonner";

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
  const [upvoted, setUpvoted] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const depthColors = [
    'border-l-primary/60',
    'border-l-primary/40',
    'border-l-primary/25',
    'border-l-primary/15',
  ];

  return (
    <div className={`${depth > 0 ? `pl-4 border-l-2 ${depthColors[Math.min(depth - 1, 3)]}` : ''}`}>
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
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
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
        <div className="ml-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} lang={lang} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI PANEL ───
function AIPanel({ onClose, lang }: { onClose: () => void; lang: 'ko' | 'en' }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    {
      role: 'ai',
      text: lang === 'ko'
        ? '안녕하세요! 이 글에 대해 궁금한 점이 있으신가요? 내용 요약, 핵심 개념 설명, 관련 자료 추천 등을 도와드릴 수 있습니다.'
        : "Hello! Do you have questions about this article? I can help with summaries, explaining key concepts, or recommending related resources.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const aiResponses = {
    ko: [
      '2026년 트렌드에서 휴먼인더루프는 AI가 초안을 만들고 사람이 책임 판단을 내리는 협업 구조를 뜻합니다. 특히 AX조직 설계와 함께 논의됩니다.',
      '프라이스 디코딩과 제로클릭은 함께 봐야 합니다. 클릭 이전에 정보가 소비되는 환경일수록 가격 구조를 해석하는 역량이 더 중요해집니다.',
      '관련 읽을거리로 랜딩의 2026 트렌드 특집(휴먼인더루프, 필코노미, 제로클릭, 레디코어, AX조직, 픽셀라이프 등)을 추천드립니다.',
    ],
    en: [
      'In 2026 trends, Human-in-the-Loop means AI creates drafts while humans keep final accountability. It is tightly connected to AX organization design.',
      'Price Decoding and Zero Click should be read together. The less users click, the more important pricing-structure literacy becomes.',
      'For related reading, check the 2026 trend special on the landing page covering Human-in-the-Loop, Feelconomy, Zero Click, Ready Core, AX Organization, and Pixel Life.',
    ],
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    setTimeout(() => {
      const responses = aiResponses[lang];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setLoading(false);
    }, 1200);
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
          {lang === 'ko' ? 'Ollama 로컬 AI · OpenAI 폴백' : 'Ollama Local AI · OpenAI Fallback'}
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
  const { lang: globalLang } = useLanguage();
  const [lang, setLang] = useState<'ko' | 'en'>(globalLang);
  const [langTransitioning, setLangTransitioning] = useState(false);
  const [hasLocalLanguageOverride, setHasLocalLanguageOverride] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const post = posts.find(p => p.id === id) || posts[0];
  const postComments = comments.filter(c => c.postId === post.id);
  const diff = { beginner: { ko: '입문', en: 'Beginner' }, intermediate: { ko: '중급', en: 'Intermediate' }, advanced: { ko: '심화', en: 'Advanced' } }[post.difficulty];

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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <div className="relative">
      {/* Reading progress bar */}
      <div className="fixed top-14 left-0 right-0 z-40 h-0.5 bg-border">
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <div className="flex">
        {/* ─── ARTICLE ─── */}
        <div className={`flex-1 min-w-0 transition-all duration-200 ${showAI ? 'mr-0' : ''}`}>
          <div className="max-w-2xl mx-auto px-6 py-10">
            {/* Back navigation */}
            <Link href="/feed">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 cursor-pointer w-fit">
                <ChevronLeft size={16} />
                {lang === 'ko' ? '피드로 돌아가기' : 'Back to Feed'}
              </div>
            </Link>

            {/* Article header */}
            <header className="mb-8">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="keyp-season-badge">
                  {post.seasonId.toUpperCase()} · EP.{post.episode}
                </span>
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
                    {post.readTime}min
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
                onClick={() => setUpvoted(!upvoted)}
              >
                <ArrowUp size={15} />
                {post.upvoteCount + (upvoted ? 1 : 0)}
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
                onClick={() => {
                  setBookmarked(!bookmarked);
                  toast(bookmarked ? '북마크 해제' : '북마크 저장됨');
                }}
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
                    src={currentUser.avatar}
                    alt={currentUser.displayName}
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
                        onClick={() => {
                          toast(lang === 'ko' ? '댓글이 등록되었습니다' : 'Comment posted');
                          setCommentInput('');
                        }}
                        disabled={!commentInput.trim()}
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
                      ? '이 글은 과거 시즌의 아카이브입니다. 댓글 작성이 불가합니다.'
                      : 'This post is from a past season archive. Comments are disabled.'}
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
          <div className="hidden lg:flex flex-col w-80 shrink-0 sticky top-14 h-[calc(100vh-56px)] border-l border-border">
            <AIPanel onClose={() => setShowAI(false)} lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
}
