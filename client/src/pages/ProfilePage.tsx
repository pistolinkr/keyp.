/*
 * KEYP. PROFILE PAGE
 * Design: Sharp Editorial Intelligence
 * Layout: Profile header + Posts grid + Stats sidebar
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { users, posts, seasons, currentUser } from "@/lib/mockData";
import { ChevronLeft, BookOpen, MessageSquare, Bookmark, Award, Calendar, Globe } from "lucide-react";
import { toast } from "sonner";

interface ProfilePageProps {
  username: string;
}

export default function ProfilePage({ username }: ProfilePageProps) {
  const { lang, setLang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'bookmarks'>('posts');

  const user = users.find(u => u.username === username) || users[0];
  const isOwnProfile = user.username === currentUser.username;
  const userPosts = posts.filter(p => p.author.id === user.id);
  const getSeasonPostCount = (seasonId: string) =>
    posts.filter(p => p.seasonId === seasonId && p.author.id === user.id).length;

  const xpToNextLevel = 1000 - (user.xp % 1000);
  const xpProgress = ((user.xp % 1000) / 1000) * 100;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [username]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 lg:flex lg:flex-col lg:h-[calc(100vh-56px)] lg:overflow-hidden">
      {/* Back */}
      <Link
        href="/feed"
        className="inline-flex w-fit self-start items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
          <ChevronLeft size={16} />
          {lang === 'ko' ? '피드로 돌아가기' : 'Back to Feed'}
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        {/* ─── LEFT: Profile ─── */}
        <div className="lg:w-72 shrink-0 lg:overflow-hidden">
          {/* Profile card */}
          <div className="border border-border p-6 mb-4">
            {/* Avatar */}
            <div className="flex items-start gap-4 mb-5">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-16 h-16 object-cover border-2 border-border"
                />
                {user.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-bold">✓</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-lg leading-tight" style={{ fontFamily: 'Noto Sans KR' }}>
                  {lang === 'ko' ? user.displayName : user.displayNameEn}
                </h1>
                <p className="font-mono text-xs text-muted-foreground">@{user.username}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-mono text-xs text-primary border border-primary px-1.5 py-0.5">
                    Lv.{user.level}
                  </span>
                  <span className="keyp-season-badge text-xs">{user.joinedSeason}</span>
                </div>
              </div>
            </div>

            {/* XP bar */}
            <div className="mb-5">
              <div className="flex justify-between mb-1.5">
                <span className="font-mono text-xs text-muted-foreground">{user.xp.toLocaleString()} XP</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {lang === 'ko' ? `다음 레벨까지 ${xpToNextLevel} XP` : `${xpToNextLevel} XP to next level`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-700"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {lang === 'ko' ? user.bio : user.bioEn}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {user.tags.map((tag) => (
                <span key={tag} className="font-mono text-xs border border-border px-2 py-0.5 text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <div className="font-bold text-lg">{userPosts.length}</div>
                <div className="font-mono text-xs text-muted-foreground">{lang === 'ko' ? '게시글' : 'Posts'}</div>
              </div>
              <div className="text-center border-x border-border">
                <div className="font-bold text-lg">{user.commentCount}</div>
                <div className="font-mono text-xs text-muted-foreground">{lang === 'ko' ? '댓글' : 'Comments'}</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{user.level}</div>
                <div className="font-mono text-xs text-muted-foreground">{lang === 'ko' ? '레벨' : 'Level'}</div>
              </div>
            </div>
          </div>

          {/* Follow button (hidden on own profile) */}
          {!isOwnProfile && (
            <button
              className="w-full keyp-btn-primary py-2.5 text-sm mb-4"
              onClick={() => toast(lang === 'ko' ? '팔로우했습니다' : 'Followed')}
            >
              {lang === 'ko' ? '팔로우' : 'Follow'}
            </button>
          )}

          {/* Season history */}
          <div className="border border-border p-4">
            <p className="keyp-section-label mb-3">SEASON HISTORY</p>
            <div className="space-y-2">
              {seasons.map((season) => (
                <div key={season.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs ${season.isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {season.label}
                    </span>
                    {season.isActive && <span className="keyp-season-badge text-xs">ACTIVE</span>}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {getSeasonPostCount(season.id)} posts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Content ─── */}
        <div className="flex-1 min-w-0 lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1">
          {/* Sticky tabs/language bar */}
          <div className="sticky top-0 z-20 bg-background flex items-center justify-between mb-6">
            <div className="flex border-b border-border">
              {[
                { id: 'posts', icon: BookOpen, label: lang === 'ko' ? '게시글' : 'Posts' },
                { id: 'comments', icon: MessageSquare, label: lang === 'ko' ? '댓글' : 'Comments' },
                { id: 'bookmarks', icon: Bookmark, label: lang === 'ko' ? '북마크' : 'Bookmarks' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-foreground text-foreground font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="keyp-lang-toggle">
              <button className={lang === 'ko' ? 'active' : ''} onClick={() => setLang('ko')}>KO</button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            </div>
          </div>

          {/* Posts tab */}
          {activeTab === 'posts' && (
            <div>
              {userPosts.length === 0 ? (
                <div className="py-16 text-center border border-border">
                  <BookOpen size={24} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {lang === 'ko' ? '작성한 게시글이 없습니다' : 'No posts yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {userPosts.map((post, i) => (
                    <Link key={post.id} href={`/post/${post.id}`}>
                      <article
                        className="border-b border-border py-5 hover:bg-accent/30 transition-colors cursor-pointer px-2 -mx-2 animate-fade-in-up opacity-0"
                        style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'forwards' }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="keyp-season-badge text-xs">{post.seasonId.toUpperCase()} · EP.{post.episode}</span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {lang === 'ko' ? post.category : post.categoryEn}
                              </span>
                            </div>
                            <h3 className="font-bold text-base mb-1.5 hover:text-primary transition-colors" style={{ fontFamily: 'Noto Sans KR' }}>
                              {lang === 'ko' ? post.title : post.titleEn}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {lang === 'ko' ? post.excerpt : post.excerptEn}
                            </p>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span className="font-mono text-xs flex items-center gap-1">
                                <Award size={11} />
                                {post.upvoteCount}
                              </span>
                              <span className="font-mono text-xs flex items-center gap-1">
                                <MessageSquare size={11} />
                                {post.commentCount}
                              </span>
                              <span className="font-mono text-xs flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(post.createdAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              {post.isReadOnly && (
                                <span className="font-mono text-xs border border-border px-1.5 py-0.5">READ-ONLY</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments tab */}
          {activeTab === 'comments' && (
            <div className="py-16 text-center border border-border">
              <MessageSquare size={24} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {lang === 'ko' ? `${user.commentCount}개의 댓글을 작성했습니다` : `${user.commentCount} comments written`}
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                {lang === 'ko' ? '댓글 목록 기능 준비 중' : 'Comment list coming soon'}
              </p>
            </div>
          )}

          {/* Bookmarks tab */}
          {activeTab === 'bookmarks' && (
            <div className="py-16 text-center border border-border">
              <Bookmark size={24} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {lang === 'ko' ? '북마크한 글이 없습니다' : 'No bookmarks yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
