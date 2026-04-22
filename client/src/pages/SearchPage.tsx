/*
 * KEYP. SEARCH PAGE
 * Design: Sharp Editorial Intelligence
 * Features: Full-text search, category filter, user search
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trendingTopics } from "@/lib/mockData";
import { deriveCategoriesFromPosts, getPublishedPosts } from "@/lib/contentApi";
import type { Post, User } from "@/lib/mockData";
import { Search, X, Clock, Eye, ArrowUp, User as UserIcon, FileText, TrendingUp } from "lucide-react";

interface SearchPageProps {
  query?: string;
}

export default function SearchPage({ query: initialQuery = '' }: SearchPageProps) {
  const { lang, setLang } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<'all' | 'posts' | 'users'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState(() => deriveCategoriesFromPosts([]));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await getPublishedPosts();
      if (cancelled) return;
      setPosts(list);
      setCategories(deriveCategoriesFromPosts(list));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const authorsFromPosts = useMemo(() => {
    const byUsername = new Map<string, User>();
    for (const p of posts) {
      if (!byUsername.has(p.author.username)) {
        byUsername.set(p.author.username, p.author);
      }
    }
    return Array.from(byUsername.values());
  }, [posts]);

  // Keep search input in sync with URL query, even on same-path query changes.
  useEffect(() => {
    const syncQueryFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      setQuery(q ?? '');
    };

    syncQueryFromUrl();
    window.addEventListener("popstate", syncQueryFromUrl);
    return () => window.removeEventListener("popstate", syncQueryFromUrl);
  }, []);

  const filteredPosts = posts.filter(p => {
    if (!query) return true;
    const q = query.toLowerCase();
    const titleMatch = (lang === 'ko' ? p.title : p.titleEn).toLowerCase().includes(q);
    const excerptMatch = (lang === 'ko' ? p.excerpt : p.excerptEn).toLowerCase().includes(q);
    const tagMatch = (lang === 'ko' ? p.tags : p.tagsEn).some(t => t.toLowerCase().includes(q));
    const catMatch = (lang === 'ko' ? p.category : p.categoryEn).toLowerCase().includes(q);
    return titleMatch || excerptMatch || tagMatch || catMatch;
  }).filter(p => {
    if (activeCategory === 'all') return true;
    const cat = categories.find(c => c.id === activeCategory);
    return cat ? p.category === cat.label : true;
  });

  const filteredUsers = authorsFromPosts.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.displayNameEn.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Search header */}
      <div className="mb-8">
        <p className="keyp-section-label mb-3">SEARCH</p>
        <div className="flex gap-3 items-center">
          <div className="flex-1 flex items-center gap-2 border border-border bg-muted px-4 py-3 focus-within:border-primary transition-colors">
            <Search size={17} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'ko' ? '글, 사용자, 태그 검색...' : 'Search posts, users, tags...'}
              className="flex-1 bg-transparent focus:outline-none text-base"
              autoFocus
            />
            {query && (
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setQuery('')}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="keyp-lang-toggle">
            <button className={lang === 'ko' ? 'active' : ''} onClick={() => setLang('ko')}>KO</button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>
      </div>

      {/* No query — show trending */}
      {!query && (
        <div className="space-y-8">
          {/* Trending topics */}
          <div>
            <p className="keyp-section-label mb-4">TRENDING TOPICS</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-l border-t border-border">
              {trendingTopics.map((topic, i) => (
                <button
                  key={topic.id}
                  className="border-r border-b border-border p-4 text-left hover:bg-accent/50 transition-colors group"
                  onClick={() => {
                    const keyword = lang === 'ko' ? topic.label : topic.labelEn;
                    const target = `/search?q=${encodeURIComponent(keyword)}`;
                    window.history.pushState({}, "", target);
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <TrendingUp size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {lang === 'ko' ? topic.label : topic.labelEn}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground mt-1">{topic.count} posts</div>
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="keyp-section-label mb-4">BROWSE CATEGORIES</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-l border-t border-border">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/feed?category=${cat.id}`}>
                  <div className="border-r border-b border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer group">
                    <div className="font-semibold text-sm group-hover:text-primary transition-colors mb-1">
                      {lang === 'ko' ? cat.label : cat.labelEn}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{cat.count} posts</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search results */}
      {query && (
        <div>
          {/* Result type tabs */}
          <div className="flex items-center gap-0 border-b border-border mb-6">
            {[
              { id: 'all', label: lang === 'ko' ? '전체' : 'All', count: filteredPosts.length + filteredUsers.length },
              { id: 'posts', label: lang === 'ko' ? '게시글' : 'Posts', count: filteredPosts.length },
              { id: 'users', label: lang === 'ko' ? '사용자' : 'Users', count: filteredUsers.length },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors ${
                  activeType === tab.id
                    ? 'border-foreground text-foreground font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveType(tab.id as any)}
              >
                {tab.label}
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5">{tab.count}</span>
              </button>
            ))}

            <div className="flex-1" />

            {/* Category filter */}
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="bg-muted border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-primary transition-colors text-foreground mb-1"
            >
              <option value="all">{lang === 'ko' ? '전체 카테고리' : 'All Categories'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {lang === 'ko' ? cat.label : cat.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Result count */}
          <p className="font-mono text-xs text-muted-foreground mb-4">
            "{query}" — {lang === 'ko' ? `${filteredPosts.length + filteredUsers.length}개 결과` : `${filteredPosts.length + filteredUsers.length} results`}
          </p>

          {/* Posts results */}
          {(activeType === 'all' || activeType === 'posts') && filteredPosts.length > 0 && (
            <div className="mb-8">
              {activeType === 'all' && (
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-muted-foreground" />
                  <p className="keyp-section-label">POSTS ({filteredPosts.length})</p>
                </div>
              )}
              <div className="space-y-0">
                {filteredPosts.map((post, i) => (
                  <Link key={post.id} href={`/post/${post.id}`}>
                    <article
                      className="border-b border-border py-4 hover:bg-accent/30 transition-colors cursor-pointer px-2 -mx-2 animate-fade-in-up opacity-0"
                      style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'forwards' }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {lang === 'ko' ? post.category : post.categoryEn}
                        </span>
                      </div>
                      <h3 className="font-bold text-base mb-1 hover:text-primary transition-colors" style={{ fontFamily: 'Noto Sans KR' }}>
                        {lang === 'ko' ? post.title : post.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {lang === 'ko' ? post.excerpt : post.excerptEn}
                      </p>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <img src={post.author.avatar} alt={post.author.displayName} className="w-4 h-4 object-cover border border-border" />
                          <span className="font-mono text-xs">
                            {lang === 'ko' ? post.author.displayName : post.author.displayNameEn}
                          </span>
                        </div>
                        <span className="font-mono text-xs flex items-center gap-1">
                          <Clock size={11} />{post.readTime}min
                        </span>
                        <span className="font-mono text-xs flex items-center gap-1">
                          <ArrowUp size={11} />{post.upvoteCount}
                        </span>
                        <span className="font-mono text-xs flex items-center gap-1">
                          <Eye size={11} />{post.viewCount.toLocaleString()}
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Users results */}
          {(activeType === 'all' || activeType === 'users') && filteredUsers.length > 0 && (
            <div>
              {activeType === 'all' && (
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon size={14} className="text-muted-foreground" />
                  <p className="keyp-section-label">USERS ({filteredUsers.length})</p>
                </div>
              )}
              <div className="space-y-0">
                {filteredUsers.map((user, i) => (
                  <Link key={user.id} href={`/profile/${user.username}`}>
                    <div
                      className="flex items-center gap-4 border-b border-border py-4 hover:bg-accent/30 transition-colors cursor-pointer px-2 -mx-2 animate-fade-in-up opacity-0"
                      style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'forwards' }}
                    >
                      <img src={user.avatar} alt={user.displayName} className="w-10 h-10 object-cover border border-border" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm hover:text-primary transition-colors">
                            {lang === 'ko' ? user.displayName : user.displayNameEn}
                          </span>
                          {user.isVerified && <span className="text-primary text-xs">✓</span>}
                          <span className="font-mono text-xs text-primary border border-primary px-1 py-0.5">Lv.{user.level}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {lang === 'ko' ? user.bio : user.bioEn}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs text-muted-foreground">
                          {posts.filter((p) => p.author.id === user.id).length} posts
                        </div>
                        <div className="keyp-season-badge text-xs mt-1">{user.joinedSeason}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {filteredPosts.length === 0 && filteredUsers.length === 0 && (
            <div className="py-16 text-center border border-border">
              <Search size={24} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {lang === 'ko' ? `"${query}"에 대한 결과가 없습니다` : `No results for "${query}"`}
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-2">
                {lang === 'ko' ? '다른 검색어를 시도해보세요' : 'Try a different search term'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
