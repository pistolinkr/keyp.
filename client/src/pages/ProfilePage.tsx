/*
 * KEYP. PROFILE PAGE
 * Design: Sharp Editorial Intelligence
 * Layout: Profile header + Posts grid + Stats sidebar
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PLACEHOLDER_AVATAR } from "@/lib/mockData";
import type { User as UserType, Post as PostType } from "@/lib/mockData";
import {
  ensureMyProfileRow,
  getCommentsByAuthorUsername,
  getMyBookmarkedArticleIds,
  getMyProfileFromSupabase,
  getProfileFromSupabase,
  getPublishedPosts,
  updateMyProfile,
  uploadAvatarFile,
} from "@/lib/contentApi";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  BookOpen,
  MessageSquare,
  Bookmark,
  Award,
  Calendar,
  Pencil,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ProfilePageProps {
  username: string;
}

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export default function ProfilePage({ username }: ProfilePageProps) {
  const { lang, setLang } = useLanguage();
  const { user: authUser, profileUsername } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'bookmarks'>('posts');
  const [remoteProfile, setRemoteProfile] = useState<UserType | null>(null);
  const [allPosts, setAllPosts] = useState<PostType[]>([]);
  const [userComments, setUserComments] = useState<Array<{ id: string; postId: string; content: string; contentEn: string; createdAt: string; originalLang: "ko" | "en" }>>([]);
  const [bookmarkedItems, setBookmarkedItems] = useState<Array<{ articleId: string; createdAt: string }>>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formUsername, setFormUsername] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formDisplayNameEn, setFormDisplayNameEn] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formBioEn, setFormBioEn] = useState("");
  const [formTags, setFormTags] = useState("");
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRemoteProfile(null);

    (async () => {
      if (!isSupabaseConfigured()) return;

      const slug = username.trim().toLowerCase();
      const navSlug = profileUsername.trim().toLowerCase();

      if (authUser && !authUser.isLocalDev) {
        const me = await getMyProfileFromSupabase();
        if (cancelled) return;
        if (me) {
          const isOwn =
            me.username === slug || slug === navSlug;
          if (isOwn) {
            setRemoteProfile(me);
            return;
          }
        } else if (slug === navSlug) {
          const ensured = await ensureMyProfileRow();
          if (cancelled) return;
          if (ensured) {
            setRemoteProfile(ensured);
            return;
          }
        }
      }

      const row = await getProfileFromSupabase(slug);
      if (cancelled) return;
      if (row) setRemoteProfile(row);
    })();

    return () => {
      cancelled = true;
    };
  }, [username, authUser?.id, authUser?.isLocalDev, profileUsername]);

  useEffect(() => {
    let cancelled = false;
    getPublishedPosts().then((list) => {
      if (!cancelled) setAllPosts(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const targetUsername = remoteProfile?.username?.trim().toLowerCase();
    if (!targetUsername || !isSupabaseConfigured()) {
      setUserComments([]);
      setCommentsLoading(false);
      return;
    }

    setCommentsLoading(true);
    void (async () => {
      const rows = await getCommentsByAuthorUsername(targetUsername);
      if (cancelled) return;
      setUserComments(
        rows.map((comment) => ({
          id: comment.id,
          postId: comment.postId,
          content: comment.content,
          contentEn: comment.contentEn,
          createdAt: comment.createdAt,
          originalLang: comment.originalLang,
        })),
      );
      setCommentsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [remoteProfile?.username]);

  useEffect(() => {
    let cancelled = false;
    const owner =
      Boolean(authUser) &&
      (remoteProfile?.id === authUser?.id ||
        username.trim().toLowerCase() === profileUsername.trim().toLowerCase());

    if (!owner || !authUser || authUser.isLocalDev || !isSupabaseConfigured()) {
      setBookmarkedItems([]);
      setBookmarksLoading(false);
      return;
    }

    setBookmarksLoading(true);
    void (async () => {
      const rows = await getMyBookmarkedArticleIds();
      if (cancelled) return;
      setBookmarkedItems(rows);
      setBookmarksLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, authUser?.isLocalDev, profileUsername, remoteProfile?.id, username]);

  const slug = username.trim().toLowerCase();
  const navSlug = profileUsername.trim().toLowerCase();
  const isOwnProfile = Boolean(
    authUser &&
      (remoteProfile?.id === authUser.id || slug === navSlug),
  );
  const canEditProfile =
    Boolean(authUser && !authUser.isLocalDev && isOwnProfile) && isSupabaseConfigured();

  const authProfileUser = authUser
    ? {
        id: authUser.id,
        username: profileUsername,
        displayName:
          (typeof authUser.userMetadata?.full_name === "string" && authUser.userMetadata.full_name) ||
          authUser.email?.split("@")[0] ||
          "User",
        displayNameEn:
          (typeof authUser.userMetadata?.full_name === "string" && authUser.userMetadata.full_name) ||
          authUser.email?.split("@")[0] ||
          "User",
        avatar:
          (typeof authUser.userMetadata?.avatar_url === "string" && authUser.userMetadata.avatar_url) ||
          PLACEHOLDER_AVATAR,
        bio:
          (typeof authUser.userMetadata?.bio === "string" && authUser.userMetadata.bio) ||
          "KEYP. 사용자 프로필입니다.",
        bioEn:
          (typeof authUser.userMetadata?.bio === "string" && authUser.userMetadata.bio) ||
          "KEYP. user profile.",
        level: 1,
        xp: 0,
        joinedSeason: "",
        postCount: 0,
        commentCount: 0,
        isVerified: Boolean(authUser.emailConfirmedAt),
        tags: ["new-user"],
      }
    : null;
  const user =
    remoteProfile ?? (isOwnProfile && authProfileUser ? authProfileUser : null);
  const userPosts = user
    ? allPosts.filter(
        (p) => p.author.username === user.username || p.author.id === user.id,
      )
    : [];

  const xpToNextLevel = user ? 1000 - (user.xp % 1000) : 0;
  const xpProgress = user ? ((user.xp % 1000) / 1000) * 100 : 0;

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const openEdit = () => {
    if (!authUser || authUser.isLocalDev || !canEditProfile) return;
    void (async () => {
      let row = remoteProfile?.id === authUser.id ? remoteProfile : null;
      if (!row) {
        row = await getMyProfileFromSupabase();
      }
      if (!row || row.id !== authUser.id) {
        row = await ensureMyProfileRow();
      }
      if (!row || row.id !== authUser.id) {
        toast.error(
          lang === "ko" ? "프로필을 불러올 수 없습니다." : "Could not load profile.",
        );
        return;
      }
      setRemoteProfile(row);
      setFormUsername(row.username);
      setFormDisplayName(row.displayName);
      setFormDisplayNameEn(row.displayNameEn);
      setFormBio(row.bio);
      setFormBioEn(row.bioEn);
      setFormTags(row.tags.join(", "));
      setPendingAvatar(null);
      setAvatarPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setEditing(true);
    })();
  };

  const cancelEdit = () => {
    setEditing(false);
    setPendingAvatar(null);
    setAvatarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const saveProfile = async () => {
    if (!authUser || saving) return;
    let profileRow = remoteProfile?.id === authUser.id ? remoteProfile : null;
    if (!profileRow) {
      profileRow = await getMyProfileFromSupabase();
    }
    if (!profileRow || profileRow.id !== authUser.id) {
      profileRow = await ensureMyProfileRow();
    }
    if (!profileRow || profileRow.id !== authUser.id) {
      toast.error(
        lang === "ko" ? "프로필을 저장할 수 없습니다." : "Could not save profile.",
      );
      return;
    }
    setRemoteProfile(profileRow);
    const u = formUsername.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(u)) {
      toast.error(
        lang === "ko"
          ? "사용자 이름은 3~32자, 영문 소문자·숫자·._- 만 사용할 수 있습니다."
          : "Username must be 3–32 characters (lowercase letters, digits, . _ -).",
      );
      return;
    }
    if (!formDisplayName.trim()) {
      toast.error(lang === "ko" ? "표시 이름을 입력하세요." : "Enter a display name.");
      return;
    }
    setSaving(true);
    try {
      let nextAvatarUrl: string | undefined;
      if (pendingAvatar) {
        const up = await uploadAvatarFile(pendingAvatar);
        if (!up.ok) {
          toast.error(
            up.error === "invalid_type"
              ? lang === "ko"
                ? "JPEG, PNG, WebP 이미지만 업로드할 수 있습니다."
                : "Only JPEG, PNG, or WebP images."
              : up.error,
          );
          return;
        }
        nextAvatarUrl = up.publicUrl;
      }
      const tags = parseTagsInput(formTags);
      const res = await updateMyProfile({
        username: u,
        display_name: formDisplayName.trim(),
        display_name_en: formDisplayNameEn.trim() || formDisplayName.trim(),
        bio: formBio.trim(),
        bio_en: formBioEn.trim() || formBio.trim(),
        tags,
        ...(nextAvatarUrl !== undefined ? { avatar_url: nextAvatarUrl } : {}),
      });
      if (!res.ok) {
        if (res.error === "username_taken") {
          toast.error(
            lang === "ko" ? "이미 사용 중인 사용자 이름입니다." : "That username is already taken.",
          );
        } else {
          toast.error(res.error);
        }
        return;
      }
      toast.success(lang === "ko" ? "프로필을 저장했습니다." : "Profile saved.");
      setEditing(false);
      setPendingAvatar(null);
      setAvatarPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      const refreshed = await getProfileFromSupabase(u);
      if (refreshed) setRemoteProfile(refreshed);
      if (u !== username) {
        setLocation(`/profile/${u}`);
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [username]);

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground mb-6">
          {lang === "ko" ? "프로필을 찾을 수 없습니다." : "Profile not found."}
        </p>
        <Link href="/feed">
          <span className="text-sm text-primary hover:underline cursor-pointer">
            {lang === "ko" ? "피드로 돌아가기" : "Back to feed"}
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 lg:flex lg:flex-col lg:h-[calc(100vh-72px)] lg:overflow-hidden">
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
            {editing && canEditProfile ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={avatarPreviewUrl || user.avatar}
                      alt=""
                      className="w-16 h-16 object-cover border-2 border-border"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Label htmlFor="profile-avatar-input" className="font-mono text-xs text-muted-foreground">
                      {lang === "ko" ? "프로필 사진" : "Avatar"}
                    </Label>
                    <input
                      id="profile-avatar-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="block w-full text-xs font-mono text-muted-foreground file:mr-2 file:border file:border-border file:bg-transparent file:px-2 file:py-1 file:text-xs"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setAvatarPreviewUrl((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return URL.createObjectURL(f);
                        });
                        setPendingAvatar(f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-username" className="font-mono text-xs">
                    {lang === "ko" ? "사용자 이름" : "Username"}
                  </Label>
                  <Input
                    id="profile-username"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="font-mono text-sm"
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-display-ko" className="font-mono text-xs">
                    {lang === "ko" ? "표시 이름 (한국어)" : "Display name (KO)"}
                  </Label>
                  <Input
                    id="profile-display-ko"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    className="text-sm"
                    style={{ fontFamily: "Noto Sans KR" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-display-en" className="font-mono text-xs">
                    {lang === "ko" ? "표시 이름 (English)" : "Display name (EN)"}
                  </Label>
                  <Input
                    id="profile-display-en"
                    value={formDisplayNameEn}
                    onChange={(e) => setFormDisplayNameEn(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-bio-ko" className="font-mono text-xs">
                    {lang === "ko" ? "소개 (한국어)" : "Bio (KO)"}
                  </Label>
                  <Textarea
                    id="profile-bio-ko"
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    rows={3}
                    className="text-sm resize-y min-h-[72px]"
                    style={{ fontFamily: "Noto Sans KR" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-bio-en" className="font-mono text-xs">
                    {lang === "ko" ? "소개 (English)" : "Bio (EN)"}
                  </Label>
                  <Textarea
                    id="profile-bio-en"
                    value={formBioEn}
                    onChange={(e) => setFormBioEn(e.target.value)}
                    rows={3}
                    className="text-sm resize-y min-h-[72px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-tags" className="font-mono text-xs text-muted-foreground">
                    {lang === "ko" ? "태그 (쉼표로 구분)" : "Tags (comma-separated)"}
                  </Label>
                  <Input
                    id="profile-tags"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    className="flex-1 keyp-btn-primary py-2.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    disabled={saving}
                    onClick={() => void saveProfile()}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                    {lang === "ko" ? "저장" : "Save"}
                  </button>
                  <button
                    type="button"
                    className="flex-1 border border-border py-2.5 text-sm hover:bg-accent/40 transition-colors"
                    disabled={saving}
                    onClick={cancelEdit}
                  >
                    {lang === "ko" ? "취소" : "Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                    <h1 className="font-bold text-lg leading-tight" style={{ fontFamily: "Noto Sans KR" }}>
                      {lang === "ko" ? user.displayName : user.displayNameEn}
                    </h1>
                    <p className="font-mono text-xs text-muted-foreground">@{user.username}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-mono text-xs text-primary border border-primary px-1.5 py-0.5">
                        Lv.{user.level}
                      </span>
                      {user.joinedSeason ? (
                        <span className="keyp-season-badge text-xs">{user.joinedSeason}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* XP bar */}
                <div className="mb-5">
                  <div className="flex justify-between mb-1.5">
                    <span className="font-mono text-xs text-muted-foreground">{user.xp.toLocaleString()} XP</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {lang === "ko" ? `다음 레벨까지 ${xpToNextLevel} XP` : `${xpToNextLevel} XP to next level`}
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
                  {lang === "ko" ? user.bio : user.bioEn}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {user.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-xs border border-border px-2 py-0.5 text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="font-bold text-lg">{userPosts.length}</div>
                    <div className="font-mono text-xs text-muted-foreground">{lang === "ko" ? "게시글" : "Posts"}</div>
                  </div>
                  <div className="text-center border-x border-border">
                    <div className="font-bold text-lg">{user.commentCount}</div>
                    <div className="font-mono text-xs text-muted-foreground">{lang === "ko" ? "댓글" : "Comments"}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{user.level}</div>
                    <div className="font-mono text-xs text-muted-foreground">{lang === "ko" ? "레벨" : "Level"}</div>
                  </div>
                </div>

                {canEditProfile && (
                  <button
                    type="button"
                    className="w-full border border-border py-2.5 text-sm mt-4 inline-flex items-center justify-center gap-2 hover:bg-accent/40 transition-colors"
                    onClick={openEdit}
                  >
                    <Pencil size={14} />
                    {lang === "ko" ? "프로필 편집" : "Edit profile"}
                  </button>
                )}
              </>
            )}
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
            <div>
              {commentsLoading ? (
                <div className="py-16 text-center border border-border">
                  <Loader2 size={24} className="text-muted-foreground mx-auto mb-3 animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    {lang === "ko" ? "댓글 목록을 불러오는 중..." : "Loading comments..."}
                  </p>
                </div>
              ) : userComments.length === 0 ? (
                <div className="py-16 text-center border border-border">
                  <MessageSquare size={24} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {lang === "ko" ? "작성한 댓글이 없습니다" : "No comments yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {userComments.map((comment, i) => {
                    const linkedPost = allPosts.find((post) => post.id === comment.postId);
                    const postTitle = linkedPost
                      ? (lang === "ko" ? linkedPost.title : linkedPost.titleEn)
                      : (lang === "ko" ? "삭제되었거나 비공개된 글" : "Deleted or private post");
                    const preview = (lang === "ko" ? comment.content : comment.contentEn) || comment.content || comment.contentEn;
                    return (
                      <Link key={comment.id} href={`/post/${comment.postId}#comments`}>
                        <article
                          className="border-b border-border py-5 hover:bg-accent/30 transition-colors cursor-pointer px-2 -mx-2 animate-fade-in-up opacity-0"
                          style={{ animationDelay: `${i * 0.03}s`, animationFillMode: "forwards" }}
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare size={15} className="mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-xs text-muted-foreground mb-1.5">
                                {lang === "ko" ? "댓글 단 글" : "Commented on"}: {postTitle}
                              </p>
                              <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                                {preview}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="font-mono text-xs text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleDateString(
                                    lang === "ko" ? "ko-KR" : "en-US",
                                    { month: "short", day: "numeric", year: "numeric" },
                                  )}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground border border-border px-1.5 py-0.5">
                                  {comment.originalLang.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bookmarks tab */}
          {activeTab === 'bookmarks' && (
            <div>
              {!isOwnProfile ? (
                <div className="py-16 text-center border border-border">
                  <Bookmark size={24} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {lang === "ko" ? "북마크 목록은 본인만 볼 수 있습니다" : "Bookmarks are visible only to the owner"}
                  </p>
                </div>
              ) : authUser?.isLocalDev ? (
                <div className="py-16 text-center border border-border">
                  <Bookmark size={24} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {lang === "ko" ? "로컬 개발 로그인에서는 북마크 목록을 불러올 수 없습니다" : "Bookmarks are unavailable in local-dev login mode"}
                  </p>
                </div>
              ) : bookmarksLoading ? (
                <div className="py-16 text-center border border-border">
                  <Loader2 size={24} className="text-muted-foreground mx-auto mb-3 animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    {lang === "ko" ? "북마크 목록을 불러오는 중..." : "Loading bookmarks..."}
                  </p>
                </div>
              ) : bookmarkedItems.length === 0 ? (
                <div className="py-16 text-center border border-border">
                  <Bookmark size={24} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {lang === "ko" ? "북마크한 글이 없습니다" : "No bookmarks yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {bookmarkedItems.map((item, i) => {
                    const post = allPosts.find((p) => p.id === item.articleId);
                    if (!post) return null;
                    return (
                      <Link key={`${item.articleId}:${item.createdAt}`} href={`/post/${item.articleId}`}>
                        <article
                          className="border-b border-border py-5 hover:bg-accent/30 transition-colors cursor-pointer px-2 -mx-2 animate-fade-in-up opacity-0"
                          style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "forwards" }}
                        >
                          <div className="flex items-start gap-3">
                            <Bookmark size={15} className="mt-0.5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-xs text-muted-foreground mb-1.5">
                                {lang === "ko" ? "북마크한 날짜" : "Bookmarked"}:{" "}
                                {new Date(item.createdAt).toLocaleDateString(
                                  lang === "ko" ? "ko-KR" : "en-US",
                                  { month: "short", day: "numeric", year: "numeric" },
                                )}
                              </p>
                              <h3 className="font-bold text-base mb-1.5 hover:text-primary transition-colors" style={{ fontFamily: "Noto Sans KR" }}>
                                {lang === "ko" ? post.title : post.titleEn}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {lang === "ko" ? post.excerpt : post.excerptEn}
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
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
