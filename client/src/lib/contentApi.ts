import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  categoryCatalog,
  posts as mockPosts,
  PLACEHOLDER_AVATAR,
  type Post,
  type Season,
  type Comment,
  type User,
  type Category,
} from "@/lib/mockData";

type ArticleContentRow = {
  article_id: string;
  locale: string;
  title: string;
  summary: string;
  content: string;
};

type ArticleTagRow = {
  article_id: string;
  locale: string;
  tag: string;
};

type ArticleRow = {
  id: string;
  slug: string;
  category: string;
  author_profile_id: string | null;
  legacy_author_id: string | null;
  author_username: string;
  author_display_name: string;
  author_display_name_en: string;
  author_avatar_url: string;
  author_level: number;
  author_xp: number;
  author_joined_season: string | null;
  author_is_verified: boolean;
  author_tags: string[] | null;
  status: string;
  /** Absent after community migration (season removed); optional for older DB snapshots */
  season_id?: string | null;
  episode: number;
  original_lang: string;
  read_time: number;
  view_count: number;
  upvote_count: number;
  comment_count: number;
  bookmark_count: number;
  created_at: string;
  updated_at: string;
  is_read_only: boolean;
  is_featured: boolean;
  difficulty: string;
  article_contents?: ArticleContentRow[] | null;
  article_tags?: ArticleTagRow[] | null;
};

type CommentRow = {
  id: string;
  article_id: string;
  parent_id: string | null;
  author_profile_id: string | null;
  author_username: string;
  author_display_name: string;
  author_display_name_en: string;
  author_avatar_url: string;
  author_level: number;
  author_is_verified: boolean;
  content_ko: string;
  content_en: string;
  original_lang: string;
  upvote_count: number;
  depth: number;
  created_at: string;
  is_read_only: boolean;
};

type BookmarkRow = {
  article_id: string;
  created_at: string;
};

let postsCache: Post[] | null = null;
let postsCacheAt = 0;
const POSTS_TTL_MS = 10_000;

export function invalidatePublishedPostsCache() {
  postsCache = null;
  postsCacheAt = 0;
}

export function deriveCategoriesFromPosts(posts: Post[]): Category[] {
  return categoryCatalog.map((c) => ({
    id: c.id,
    label: c.label,
    labelEn: c.labelEn,
    count: posts.filter((p) => p.category === c.label).length,
  }));
}

/** True if this user may open the editor for the post (UI gate; DB RLS still applies). */
export function canCurrentUserEditPost(
  post: Pick<Post, "authorProfileId" | "author">,
  userId: string | null | undefined,
  profileUsername: string | null | undefined,
  isLocalDev?: boolean,
): boolean {
  if (!userId || isLocalDev) return false;
  if (post.authorProfileId === userId) return true;
  if (post.authorProfileId != null) return false;
  const pu = profileUsername?.trim().toLowerCase();
  const au = post.author.username?.trim().toLowerCase();
  return Boolean(pu && au && pu === au);
}

function mapArticleRowToPost(row: ArticleRow): Post {
  const contents = row.article_contents ?? [];
  const tags = row.article_tags ?? [];
  const ko = contents.find((c) => c.locale === "ko");
  const en = contents.find((c) => c.locale === "en");
  const tagsKo = tags.filter((t) => t.locale === "ko").map((t) => t.tag);
  const tagsEn = tags.filter((t) => t.locale === "en").map((t) => t.tag);
  const cat = categoryCatalog.find((c) => c.id === row.category);

  const author: User = {
    id: row.legacy_author_id || row.author_username,
    username: row.author_username,
    displayName: row.author_display_name,
    displayNameEn: row.author_display_name_en,
    avatar: row.author_avatar_url,
    bio: "",
    bioEn: "",
    level: row.author_level,
    xp: row.author_xp,
    joinedSeason: row.author_joined_season ?? "",
    postCount: 0,
    commentCount: 0,
    isVerified: row.author_is_verified,
    tags: row.author_tags ?? [],
  };

  return {
    id: row.id,
    authorProfileId: row.author_profile_id,
    title: ko?.title ?? "",
    titleEn: en?.title ?? "",
    excerpt: ko?.summary ?? "",
    excerptEn: en?.summary ?? "",
    content: ko?.content ?? "",
    contentEn: en?.content ?? "",
    author,
    seasonId: row.season_id ?? "",
    episode: row.episode,
    category: cat?.label ?? "기술",
    categoryEn: cat?.labelEn ?? "Technology",
    tags: tagsKo,
    tagsEn: tagsEn,
    originalLang: row.original_lang as "ko" | "en",
    readTime: row.read_time,
    viewCount: row.view_count,
    upvoteCount: row.upvote_count,
    commentCount: row.comment_count,
    bookmarkCount: row.bookmark_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isReadOnly: row.is_read_only,
    isFeatured: row.is_featured,
    difficulty: row.difficulty as Post["difficulty"],
  };
}

async function fetchPublishedPostsFromSupabase(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      `
      *,
      article_contents (*),
      article_tags (*)
    `,
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }
  return (data as ArticleRow[] | null)?.map(mapArticleRowToPost) ?? [];
}

export async function getPublishedPosts(): Promise<Post[]> {
  if (!isSupabaseConfigured()) {
    return mockPosts;
  }
  if (postsCache && Date.now() - postsCacheAt < POSTS_TTL_MS) {
    return postsCache;
  }
  try {
    const list = await fetchPublishedPostsFromSupabase();
    postsCache = list;
    postsCacheAt = Date.now();
    return list;
  } catch (err) {
    console.error("getPublishedPosts (Supabase):", err);
    return [];
  }
}

const ANON_VIEWER_STORAGE_KEY = "keyp.anon_viewer_id";

/** Stable id for deduping views when not signed in (24h server cooldown per article). */
function getOrCreateAnonViewerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = window.localStorage.getItem(ANON_VIEWER_STORAGE_KEY);
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      id = crypto.randomUUID();
      window.localStorage.setItem(ANON_VIEWER_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export async function incrementArticleViewCount(articleId: string): Promise<number | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const pAnonViewerKey = user?.id ? null : getOrCreateAnonViewerId();

    const { data, error } = await supabase.rpc("increment_article_view_count", {
      p_article_id: articleId,
      p_anon_viewer_key: pAnonViewerKey,
    });
    if (error) {
      throw error;
    }
    // Any post list cache should be considered stale after a counter update.
    invalidatePublishedPostsCache();
    return typeof data === "number" ? data : null;
  } catch (err) {
    console.error("incrementArticleViewCount (Supabase):", err);
    return null;
  }
}

export async function getPostById(id: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) {
    return mockPosts.find((p) => p.id === id) ?? null;
  }
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(
        `
        *,
        article_contents (*),
        article_tags (*)
      `,
      )
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }
    return mapArticleRowToPost(data as ArticleRow);
  } catch (err) {
    console.error("getPostById (Supabase):", err);
    return null;
  }
}

function mapCommentRowToComment(row: CommentRow): Comment {
  const author: User = {
    id: row.author_username,
    username: row.author_username,
    displayName: row.author_display_name,
    displayNameEn: row.author_display_name_en,
    avatar: row.author_avatar_url,
    bio: "",
    bioEn: "",
    level: row.author_level,
    xp: 0,
    joinedSeason: "",
    postCount: 0,
    commentCount: 0,
    isVerified: row.author_is_verified,
    tags: [],
  };

  return {
    id: row.id,
    postId: row.article_id,
    parentId: row.parent_id,
    authorProfileId: row.author_profile_id,
    author,
    content: row.content_ko,
    contentEn: row.content_en,
    originalLang: row.original_lang as "ko" | "en",
    upvoteCount: row.upvote_count,
    depth: row.depth,
    createdAt: row.created_at,
    isReadOnly: row.is_read_only,
    replies: [],
  };
}

function nestComments(flat: Comment[]): Comment[] {
  const sorted = [...flat].sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    return Date.parse(a.createdAt) - Date.parse(b.createdAt);
  });
  const byId = new Map<string, Comment>();
  for (const c of sorted) {
    byId.set(c.id, { ...c, replies: [] });
  }
  const roots: Comment[] = [];
  for (const c of sorted) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function getCommentsForPost(postId: string): Promise<Comment[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("article_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }
    const flat = (data as CommentRow[] | null)?.map(mapCommentRowToComment) ?? [];
    return nestComments(flat);
  } catch (err) {
    console.error("getCommentsForPost (Supabase):", err);
    return [];
  }
}

export async function getCommentsByAuthorUsername(username: string): Promise<Comment[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const normalized = username.trim().toLowerCase();
  if (!normalized) return [];

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("author_username", normalized)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data as CommentRow[] | null)?.map(mapCommentRowToComment) ?? [];
  } catch (err) {
    console.error("getCommentsByAuthorUsername (Supabase):", err);
    return [];
  }
}

export async function getMyBookmarkedArticleIds(): Promise<Array<{ articleId: string; createdAt: string }>> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from("article_bookmarks")
      .select("article_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data as BookmarkRow[] | null) ?? []).map((row) => ({
      articleId: row.article_id,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("getMyBookmarkedArticleIds (Supabase):", err);
    return [];
  }
}

export async function getSeasons(): Promise<Season[]> {
  return [];
}

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  display_name_en: string;
  avatar_url: string | null;
  bio: string | null;
  bio_en: string | null;
  level: number;
  xp: number;
  joined_season: string | null;
  post_count: number;
  comment_count: number;
  is_verified: boolean;
  tags: string[] | null;
  is_onboarded?: boolean;
};

function mapProfileRowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    displayNameEn: row.display_name_en,
    avatar: row.avatar_url ?? PLACEHOLDER_AVATAR,
    bio: row.bio ?? "",
    bioEn: row.bio_en ?? "",
    level: row.level,
    xp: row.xp,
    joinedSeason: row.joined_season ?? "",
    postCount: row.post_count,
    commentCount: row.comment_count,
    isVerified: row.is_verified,
    tags: row.tags ?? [],
    isOnboarded: row.is_onboarded === true,
  };
}

/** Where to send the user immediately after magic-link / OTP session is established. */
export async function getPostAuthRedirectPath(): Promise<"/feed" | "/custom"> {
  if (!isSupabaseConfigured()) {
    return "/feed";
  }
  try {
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return "/feed";
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("is_onboarded")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("getPostAuthRedirectPath:", error);
      return "/feed";
    }
    if ((data as { is_onboarded?: boolean } | null)?.is_onboarded === true) {
      return "/feed";
    }
    return "/custom";
  } catch (err) {
    console.error("getPostAuthRedirectPath:", err);
    return "/feed";
  }
}

export async function getProfileFromSupabase(username: string): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const u = username.trim().toLowerCase();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", u)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }
    return mapProfileRowToUser(data as ProfileRow);
  } catch (err) {
    console.error("getProfileFromSupabase:", err);
    return null;
  }
}

/** Current session user's profile row (RLS: own row only). */
export async function getMyProfileFromSupabase(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return null;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }
    return mapProfileRowToUser(data as ProfileRow);
  } catch (err) {
    console.error("getMyProfileFromSupabase:", err);
    return null;
  }
}

/**
 * Create a public.profiles row for the current user if missing (RLS: own id only).
 * Mirrors handle_new_user() defaults so clients can recover from missing rows.
 */
export async function ensureMyProfileRow(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return null;
    }
    const existing = await getMyProfileFromSupabase();
    if (existing) {
      return existing;
    }

    const meta = user.user_metadata ?? {};
    const emailPrefix = user.email?.split("@")[0]?.trim() ?? "";
    const fromMeta = typeof meta.username === "string" ? meta.username.trim() : "";
    let uname = fromMeta || emailPrefix || `user_${user.id.replace(/-/g, "").slice(0, 12)}`;
    uname = uname.toLowerCase();

    const fullName =
      (typeof meta.full_name === "string" && meta.full_name.trim()) || uname;
    const avatarUrl =
      typeof meta.avatar_url === "string" && meta.avatar_url.trim()
        ? meta.avatar_url.trim()
        : null;

    const bio =
      typeof meta.bio === "string" && meta.bio.trim() ? meta.bio.trim() : "";

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: uname,
        display_name: fullName,
        display_name_en: fullName,
        avatar_url: avatarUrl,
        bio,
        bio_en: bio,
        tags: ["new-user"],
      })
      .select()
      .single();

    if (!error && data) {
      return mapProfileRowToUser(data as ProfileRow);
    }

    const retry = await getMyProfileFromSupabase();
    if (retry) {
      return retry;
    }

    if (error?.code === "23505") {
      const suffix = user.id.replace(/-/g, "").slice(0, 8);
      const alt = `${uname}_${suffix}`.slice(0, 32);
      const { data: d2, error: e2 } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: alt,
          display_name: fullName,
          display_name_en: fullName,
          avatar_url: avatarUrl,
          bio,
          bio_en: bio,
          tags: ["new-user"],
        })
        .select()
        .single();
      if (!e2 && d2) {
        return mapProfileRowToUser(d2 as ProfileRow);
      }
    }

    console.error("ensureMyProfileRow:", error);
    return null;
  } catch (err) {
    console.error("ensureMyProfileRow:", err);
    return null;
  }
}

export type ProfileUpdatePayload = {
  username?: string;
  display_name?: string;
  display_name_en?: string;
  bio?: string;
  bio_en?: string;
  tags?: string[];
  avatar_url?: string | null;
  is_onboarded?: boolean;
};

export async function updateMyProfile(
  updates: ProfileUpdatePayload,
): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "not_configured" };
  }
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { ok: false, error: "not_authenticated" };
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.username !== undefined) payload.username = updates.username;
  if (updates.display_name !== undefined) payload.display_name = updates.display_name;
  if (updates.display_name_en !== undefined) payload.display_name_en = updates.display_name_en;
  if (updates.bio !== undefined) payload.bio = updates.bio;
  if (updates.bio_en !== undefined) payload.bio_en = updates.bio_en;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
  if (updates.is_onboarded !== undefined) payload.is_onboarded = updates.is_onboarded;

  const { data: row, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    const code = error.code;
    const message =
      code === "23505"
        ? "username_taken"
        : code === "PGRST116"
          ? "not_found"
          : error.message;
    return { ok: false, error: message, code };
  }

  const r = row as ProfileRow;
  await supabase.auth.updateUser({
    data: {
      username: r.username,
      full_name: r.display_name,
      avatar_url: r.avatar_url ?? "",
      bio: r.bio ?? "",
    },
  });
  await supabase.auth.refreshSession();

  return { ok: true };
}

/** Keeps uploads under typical Supabase bucket limits (projects may cap below 1 MiB). */
const AVATAR_UPLOAD_MAX_EDGE_PX = 1024;
const AVATAR_UPLOAD_BUDGET_BYTES = 480 * 1024;

/**
 * Downscale and re-encode as JPEG so phone photos do not hit storage 413 limits.
 */
async function compressImageForAvatarUpload(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    let maxEdge = AVATAR_UPLOAD_MAX_EDGE_PX;
    for (let round = 0; round < 8; round += 1) {
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const tw = Math.max(1, Math.round(bitmap.width * scale));
      const th = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("no_canvas");
      }
      ctx.drawImage(bitmap, 0, 0, tw, th);

      const qualities = [0.9, 0.82, 0.74, 0.65, 0.56, 0.48, 0.4];
      let best: Blob | null = null;
      for (const q of qualities) {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/jpeg", q);
        });
        if (!blob) continue;
        if (blob.size <= AVATAR_UPLOAD_BUDGET_BYTES) {
          return new File([blob], `avatar-${crypto.randomUUID()}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        }
        if (!best || blob.size < best.size) best = blob;
      }
      if (best && best.size <= AVATAR_UPLOAD_BUDGET_BYTES) {
        return new File([best], `avatar-${crypto.randomUUID()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
      maxEdge = Math.round(maxEdge * 0.72);
      if (maxEdge < 64) {
        break;
      }
    }
    throw new Error("still_too_large");
  } finally {
    bitmap.close();
  }
}

export async function uploadAvatarFile(
  file: File,
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "not_configured" };
  }
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: "invalid_type" };
  }
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { ok: false, error: "not_authenticated" };
  }

  let toUpload = file;
  let ext: "jpg" | "png" | "webp" =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

  const skipCompress = file.size < 80 * 1024 && file.type === "image/jpeg";

  if (!skipCompress) {
    try {
      toUpload = await compressImageForAvatarUpload(file);
      ext = "jpg";
    } catch (err) {
      console.warn("Avatar compress skipped or failed:", err);
      if (file.size > AVATAR_UPLOAD_BUDGET_BYTES) {
        return {
          ok: false,
          error: "file_too_large_compress_failed",
        };
      }
    }
  }

  const storagePayloadTooLarge = (message: string | undefined) => {
    const m = (message ?? "").toLowerCase();
    return (
      m.includes("maximum allowed size") ||
      m.includes("413") ||
      m.includes("payload too large") ||
      m.includes("too large")
    );
  };

  let path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  let { error } = await supabase.storage.from("avatars").upload(path, toUpload, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error && skipCompress && storagePayloadTooLarge(error.message)) {
    try {
      toUpload = await compressImageForAvatarUpload(file);
      ext = "jpg";
      path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      ({ error } = await supabase.storage.from("avatars").upload(path, toUpload, {
        cacheControl: "3600",
        upsert: false,
      }));
    } catch {
      return { ok: false, error: "file_too_large_compress_failed" };
    }
  }

  if (error) {
    if (storagePayloadTooLarge(error.message)) {
      return { ok: false, error: "payload_too_large" };
    }
    return { ok: false, error: error.message };
  }
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { ok: true, publicUrl: data.publicUrl };
}

export function avatarUploadErrorMessage(error: string, lang: "ko" | "en"): string {
  switch (error) {
    case "invalid_type":
      return lang === "ko"
        ? "JPEG, PNG, WebP 이미지만 업로드할 수 있습니다."
        : "Only JPEG, PNG, or WebP images.";
    case "payload_too_large":
    case "file_too_large_compress_failed":
      return lang === "ko"
        ? "이미지가 저장소 용량 제한을 넘겼습니다. 다른 사진으로 시도해 주세요. (계속되면 Supabase Storage 버킷의 최대 파일 크기를 늘려 주세요.)"
        : "Image exceeds the storage size limit. Try another photo, or increase the max file size on your Supabase Storage avatars bucket.";
    default:
      return error;
  }
}

export type OnboardingSurveyAnswerInput = {
  question_key: string;
  answer: string;
};

export async function upsertOnboardingSurveyAnswers(
  answers: OnboardingSurveyAnswerInput[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "not_configured" };
  }
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { ok: false, error: "not_authenticated" };
  }

  const rows = answers.map((a) => ({
    user_id: user.id,
    question_key: a.question_key.trim().slice(0, 128),
    answer: a.answer.trim().slice(0, 2000),
  }));

  const { error } = await supabase.from("user_onboarding_survey").upsert(rows, {
    onConflict: "user_id,question_key",
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
