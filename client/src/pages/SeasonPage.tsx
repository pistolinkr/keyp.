/*
 * KEYP. SEASON PAGE
 * Design: Sharp Editorial Intelligence
 * Features: Season archive, read-only indicator, episode list
 */
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { seasons, posts, users } from "@/lib/mockData";
import { ChevronLeft, Lock, Archive, TrendingUp, Award, Users, BookOpen } from "lucide-react";

interface SeasonPageProps {
  id: string;
}

export default function SeasonPage({ id }: SeasonPageProps) {
  const { lang, setLang } = useLanguage();

  const season = seasons.find(s => s.id === id) || seasons[0];
  const seasonPosts = posts.filter(p => p.seasonId === id);
  const isArchive = !season.isActive;

  // Top contributors for this season
  const topContributors = users.slice(0, 3).map(u => ({
    ...u,
    postCount: seasonPosts.filter(p => p.author.id === u.id).length,
  })).sort((a, b) => b.postCount - a.postCount);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Back */}
      <Link href="/feed">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 cursor-pointer w-fit">
          <ChevronLeft size={16} />
          {lang === 'ko' ? '피드로 돌아가기' : 'Back to Feed'}
        </div>
      </Link>

      {/* Season header */}
      <div className="border border-border p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {isArchive ? (
                <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground border border-border px-2 py-1">
                  <Lock size={11} />
                  {lang === 'ko' ? '아카이브 (읽기 전용)' : 'Archive (Read-Only)'}
                </div>
              ) : (
                <span className="keyp-season-badge">LIVE</span>
              )}
              <span className="keyp-section-label">SEASON</span>
            </div>

            <h1
              className="text-5xl font-black mb-2 text-foreground"
              style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}
            >
              {season.label}
            </h1>

            <p className="font-mono text-sm text-muted-foreground mb-4">
              {season.startDate} → {season.endDate || 'ONGOING'}
            </p>

            {isArchive && (
              <div className="flex items-center gap-2 p-3 bg-muted border border-border max-w-md">
                <Archive size={14} className="text-muted-foreground shrink-0" />
                <p className="font-mono text-xs text-muted-foreground">
                  {lang === 'ko'
                    ? '이 시즌은 종료되었습니다. 모든 게시글은 읽기 전용입니다.'
                    : 'This season has ended. All posts are read-only.'}
                </p>
              </div>
            )}
          </div>

          {/* Season stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
            {[
              { icon: BookOpen, value: season.episodeCount, label: lang === 'ko' ? '에피소드' : 'Episodes' },
              { icon: Users, value: '1.2K', label: lang === 'ko' ? '참여자' : 'Participants' },
              { icon: TrendingUp, value: '48K', label: lang === 'ko' ? '총 조회수' : 'Total Views' },
              { icon: Award, value: '12K', label: lang === 'ko' ? '총 추천수' : 'Total Upvotes' },
            ].map((stat, i) => (
              <div key={i} className={`p-5 text-center ${i < 3 ? 'border-r border-border' : ''}`}>
                <stat.icon size={16} className="text-muted-foreground mx-auto mb-2" />
                <div className="font-black text-2xl" style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}>
                  {stat.value}
                </div>
                <div className="font-mono text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ─── POSTS ─── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="keyp-section-label">
              {lang === 'ko' ? `게시글 ${seasonPosts.length}개` : `${seasonPosts.length} Posts`}
            </p>
            <div className="keyp-lang-toggle">
              <button className={lang === 'ko' ? 'active' : ''} onClick={() => setLang('ko')}>KO</button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            </div>
          </div>

          {seasonPosts.length === 0 ? (
            <div className="py-16 text-center border border-border">
              <BookOpen size={24} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {lang === 'ko' ? '이 시즌에 게시글이 없습니다' : 'No posts in this season'}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {seasonPosts.map((post, i) => (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <article
                    className="border-b border-border py-5 hover:bg-accent/30 transition-colors cursor-pointer px-2 -mx-2 animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="keyp-season-badge text-xs">EP.{post.episode}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {lang === 'ko' ? post.category : post.categoryEn}
                          </span>
                          {isArchive && (
                            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground border border-border px-1.5 py-0.5">
                              <Lock size={9} />
                              READ-ONLY
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base mb-1.5 hover:text-primary transition-colors" style={{ fontFamily: 'Noto Sans KR' }}>
                          {lang === 'ko' ? post.title : post.titleEn}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {lang === 'ko' ? post.excerpt : post.excerptEn}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <img src={post.author.avatar} alt={post.author.displayName} className="w-4 h-4 object-cover border border-border" />
                            <span className="font-mono text-xs text-muted-foreground">
                              {lang === 'ko' ? post.author.displayName : post.author.displayNameEn}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">{post.upvoteCount} ↑</span>
                          <span className="font-mono text-xs text-muted-foreground">{post.viewCount.toLocaleString()} views</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ─── SIDEBAR ─── */}
        <div className="lg:w-64 shrink-0 space-y-6">
          {/* All seasons */}
          <div>
            <p className="keyp-section-label mb-3">ALL SEASONS</p>
            <div className="space-y-0">
              {seasons.map((s) => (
                <Link key={s.id} href={`/season/${s.id}`}>
                  <div
                    className={`flex items-center justify-between py-3 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer px-2 -mx-2 ${
                      s.id === id ? 'text-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!s.isActive && <Lock size={11} className="text-muted-foreground" />}
                      <span className={`font-mono text-sm font-medium ${s.id === id ? 'text-primary' : ''}`}>
                        {s.label}
                      </span>
                      {s.isActive && <span className="keyp-season-badge text-xs">LIVE</span>}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{s.episodeCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top contributors */}
          <div>
            <p className="keyp-section-label mb-3">TOP CONTRIBUTORS</p>
            <div className="space-y-0">
              {topContributors.map((user, i) => (
                <Link key={user.id} href={`/profile/${user.username}`}>
                  <div className="flex items-center gap-3 py-3 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer px-2 -mx-2">
                    <span className="font-mono text-xs text-muted-foreground w-4">{i + 1}</span>
                    <img src={user.avatar} alt={user.displayName} className="w-7 h-7 object-cover border border-border" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {lang === 'ko' ? user.displayName : user.displayNameEn}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {user.postCount} {lang === 'ko' ? '게시글' : 'posts'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
