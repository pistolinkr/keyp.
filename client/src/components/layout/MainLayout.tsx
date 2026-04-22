/*
 * KEYP. MAIN LAYOUT
 * Design: Sharp Editorial Intelligence
 * Structure: Fixed Left Sidebar (256px) + Main Content + Right Context Panel
 * Sharp 0px radius, 1px borders, Noto Sans KR UI
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home, Search, PenSquare, User, Sun, Moon,
  TrendingUp, Menu, X, Bell, LogOut
} from "lucide-react";
import { PLACEHOLDER_AVATAR, trendingTopics } from "@/lib/mockData";
import { deriveCategoriesFromPosts, getPublishedPosts } from "@/lib/contentApi";
import { NavbarScrollBlur } from "@/components/layout/NavbarScrollBlur";
import { toast } from "sonner";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const { user, profileUsername, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopFeedLayout, setIsDesktopFeedLayout] = useState(false);
  const shouldHideTrendingNav = location.startsWith("/feed") && isDesktopFeedLayout;
  const profileHref = `/profile/${profileUsername}`;
  const [navCategories, setNavCategories] = useState(() =>
    deriveCategoriesFromPosts([]),
  );
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const postList = await getPublishedPosts();
      if (cancelled) return;
      setNavCategories(deriveCategoriesFromPosts(postList));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = [
    { href: "/feed", icon: Home, label: "피드", labelEn: "Feed" },
    { href: "/search", icon: Search, label: "검색", labelEn: "Search" },
    { href: "/write", icon: PenSquare, label: "글쓰기", labelEn: "Write" },
    { href: profileHref, icon: User, label: "프로필", labelEn: "Profile" },
  ];
  const sidebarLevel =
    typeof user?.userMetadata?.level === "number" ? user.userMetadata.level : 1;
  const sidebarXp =
    typeof user?.userMetadata?.xp === "number" ? user.userMetadata.xp : 0;
  const userAvatar =
    typeof user?.userMetadata?.avatar_url === "string"
      ? user.userMetadata.avatar_url
      : PLACEHOLDER_AVATAR;
  const userDisplayName =
    (typeof user?.userMetadata?.full_name === "string" && user.userMetadata.full_name) ||
    (typeof user?.userMetadata?.name === "string" && user.userMetadata.name) ||
    user?.email ||
    (lang === "ko" ? "게스트" : "Guest");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const syncLayoutMode = () => setIsDesktopFeedLayout(media.matches);

    syncLayoutMode();
    media.addEventListener("change", syncLayoutMode);
    return () => media.removeEventListener("change", syncLayoutMode);
  }, []);

  const isActive = (href: string) => location === href || location.startsWith(href + '/');
  const navigateToKeywordSearch = (keyword: string) => {
    const target = `/search?q=${encodeURIComponent(keyword)}`;
    if (window.location.pathname === "/search") {
      window.history.pushState({}, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      setLocation(target);
    }
    setSidebarOpen(false);
  };
  const navigateToCategory = (categoryId: string) => {
    const target = `/feed?category=${encodeURIComponent(categoryId)}`;
    if (window.location.pathname === "/feed") {
      window.history.pushState({}, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      setLocation(target);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ─── TOP HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[4.5rem] border-b border-border keyp-navbar flex items-center px-4 gap-4">
        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-1.5 hover:bg-accent transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Logo */}
        <Link href="/feed">
          <div className="flex items-center select-none cursor-pointer">
            <img
              src="/logo.png"
              alt="Keyp. logo"
              className="h-7 w-auto object-contain"
            />
          </div>
        </Link>

        <div className="flex-1" />

        {/* Language toggle */}
        <div className="keyp-lang-toggle">
          <button
            className={lang === 'ko' ? 'active' : ''}
            onClick={() => setLang('ko')}
          >
            KO
          </button>
          <button
            className={lang === 'en' ? 'active' : ''}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>

        {/* Notifications */}
        <button
          className="p-1.5 hover:bg-accent transition-colors relative"
          onClick={() =>
            toast.custom(() => (
              <div className="rounded-md border border-border bg-background px-4 py-3 shadow-sm">
                <p className="text-sm font-bold text-foreground">
                  {lang === "ko" ? "알림이 없습니다" : "No notifications"}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {lang === "ko"
                    ? "새로운 알림이 없습니다."
                    : "There are no new notifications."}
                </p>
              </div>
            ))
          }
        >
          <Bell size={17} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary" />
        </button>

        {/* Theme toggle */}
        <button
          className="p-1.5 hover:bg-accent transition-colors"
          onClick={toggleTheme}
          title={theme === 'light' ? '다크 모드' : '라이트 모드'}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

      </header>
      <NavbarScrollBlur />

      <div className="flex pt-[4.5rem] min-h-screen">
        {/* ─── LEFT SIDEBAR ─── */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed top-[4.5rem] left-0 bottom-0 z-40 w-64 border-r border-border bg-sidebar
            flex flex-col overflow-y-auto
            transition-transform duration-200 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
        >
          {/* Navigation */}
          <nav className="p-3 flex-1">
            <div className="mb-4">
              <p className="keyp-section-label px-3 mb-2">NAVIGATE</p>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`keyp-nav-item ${isActive(item.href) ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon size={16} strokeWidth={isActive(item.href) ? 2.5 : 2} />
                    <span>{lang === 'ko' ? item.label : item.labelEn}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Categories */}
            <div className="mb-4">
              <p className="keyp-section-label px-3 mb-2">CATEGORIES</p>
              <div className="space-y-0.5">
                {navCategories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent transition-colors cursor-pointer group text-left"
                    onClick={() => navigateToCategory(cat.id)}
                  >
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {lang === 'ko' ? cat.label : cat.labelEn}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`transition-all duration-300 ease-out ${
                shouldHideTrendingNav
                  ? "max-h-0 overflow-hidden opacity-0 blur-[2px] -translate-x-6 pointer-events-none"
                  : "max-h-96 opacity-100 blur-0 translate-x-0"
              }`}
            >
              {/* Trending */}
              <div>
                <p className="keyp-section-label px-3 mb-2">TRENDING</p>
                <div className="space-y-0.5">
                  {trendingTopics.map((topic, i) => (
                    <button
                      key={topic.id}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent transition-colors cursor-pointer group text-left"
                      onClick={() => navigateToKeywordSearch(lang === "ko" ? topic.label : topic.labelEn)}
                    >
                      <span className="font-mono text-xs text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1 truncate">
                        {lang === 'ko' ? topic.label : topic.labelEn}
                      </span>
                      <TrendingUp size={11} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-border flex items-stretch gap-3">
            <Link href={profileHref}>
              <button
                className="w-12 h-12 shrink-0 overflow-hidden border border-border hover:border-primary transition-colors"
                title={lang === "ko" ? "프로필 보기" : "View profile"}
              >
                <img
                  src={userAvatar}
                  alt={userDisplayName}
                  className="w-full h-full object-cover"
                />
              </button>
            </Link>

            {/* User XP */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium truncate">
                  {userDisplayName}
                </span>
                <span className="font-mono text-xs text-primary">
                  {lang === "ko" ? `Lv.${sidebarLevel}` : `Lv.${sidebarLevel}`}
                </span>
              </div>
              <div className="w-full h-1 bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(sidebarXp % 1000) / 10}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-xs text-muted-foreground">
                  {lang === "ko" ? `${sidebarXp} XP` : `${sidebarXp} XP`}
                </span>
                <span className="font-mono text-xs text-muted-foreground">Keyp.</span>
              </div>
            </div>
            <button
              className="w-10 h-10 shrink-0 border border-border hover:border-primary transition-colors flex items-center justify-center"
              onClick={async () => {
                try {
                  await signOut();
                  setLocation("/auth/signin");
                } catch {
                  toast.error(lang === "ko" ? "로그아웃 실패" : "Failed to sign out");
                }
              }}
              title={lang === "ko" ? "로그아웃" : "Sign out"}
            >
              <LogOut size={14} />
            </button>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 lg:ml-64 min-w-0">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

