import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type EngagementAction = "state" | "upvote_toggle" | "bookmark_toggle" | "comment_create";

type EngagementState = {
  ok: true;
  action: EngagementAction;
  articleId: string;
  upvoted: boolean;
  bookmarked: boolean;
  counters: {
    upvotes: number;
    comments: number;
    bookmarks: number;
    updatedAt: string | null;
  };
};

type EngagementError = { ok: false; error: string };
type InvokeResult = { data: any; error: { message: string; status?: number } | null };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

async function getAuthHeader(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession();
  let session = data.session;

  // If session is not in memory yet, try one explicit refresh recovery.
  if (!session) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session;
  }

  // If the token is close to expiring, refresh first to avoid 401 at the edge gateway.
  if (session?.expires_at && session.expires_at * 1000 <= Date.now() + 30_000) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session;
  }

  if (!session?.access_token) return null;
  return {
    Authorization: `Bearer ${session.access_token}`,
    ...(supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
  };
}

function getInvokeStatus(error: unknown): number | undefined {
  const e = error as { status?: number; context?: { status?: number } } | null;
  return e?.status ?? e?.context?.status;
}

async function invokeOnce(
  action: EngagementAction,
  articleId: string,
  payload: Record<string, unknown> | undefined,
  headers: Record<string, string>,
): Promise<InvokeResult> {
  if (!supabaseUrl) {
    return { data: null, error: { message: "not_configured", status: 500 } };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/engagement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        action,
        articleId,
        ...payload,
      }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        (json as { error?: string; message?: string }).error ||
        (json as { error?: string; message?: string }).message ||
        `http_${response.status}`;
      return { data: null, error: { message, status: response.status } };
    }

    return { data: json, error: null };
  } catch {
    return { data: null, error: { message: "network_error", status: 0 } };
  }
}

async function invokeEngagement(
  action: EngagementAction,
  articleId: string,
  payload?: Record<string, unknown>,
): Promise<EngagementState | EngagementError> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const initialHeaders = await getAuthHeader();
  if (!initialHeaders) return { ok: false, error: "not_authenticated" };

  const first = await invokeOnce(action, articleId, payload, initialHeaders);
  if (first.error) {
    const firstStatus = getInvokeStatus(first.error);
    if (firstStatus === 401) {
      // Session may be stale while UI still looks logged-in; refresh and retry once.
      await supabase.auth.refreshSession();
      const retriedHeaders = await getAuthHeader();
      if (!retriedHeaders) return { ok: false, error: "not_authenticated" };

      const second = await invokeOnce(action, articleId, payload, retriedHeaders);
      if (second.error) {
        if (getInvokeStatus(second.error) === 401) return { ok: false, error: "not_authenticated" };
        return { ok: false, error: second.error.message };
      }
      if (!second.data?.ok) return { ok: false, error: second.data?.error ?? "engagement_failed" };
      return second.data as EngagementState;
    }
    return { ok: false, error: first.error.message };
  }
  if (!first.data?.ok) return { ok: false, error: first.data?.error ?? "engagement_failed" };
  return first.data as EngagementState;
}

export async function getEngagementState(articleId: string) {
  return invokeEngagement("state", articleId);
}

export async function toggleArticleUpvote(articleId: string) {
  return invokeEngagement("upvote_toggle", articleId);
}

export async function toggleArticleBookmark(articleId: string) {
  return invokeEngagement("bookmark_toggle", articleId);
}

export async function createArticleComment(input: {
  articleId: string;
  content: string;
  locale: "ko" | "en";
  parentId?: string | null;
}) {
  return invokeEngagement("comment_create", input.articleId, {
    content: input.content,
    locale: input.locale,
    parentId: input.parentId ?? null,
  });
}

export function subscribeArticleEngagement(
  articleId: string,
  onChange: () => void,
): (() => void) | null {
  if (!isSupabaseConfigured()) return null;

  const channel: RealtimeChannel = supabase
    .channel(`engagement:${articleId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "articles",
      filter: `id=eq.${articleId}`,
    }, onChange)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "comments",
      filter: `article_id=eq.${articleId}`,
    }, onChange)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "article_upvotes",
      filter: `article_id=eq.${articleId}`,
    }, onChange)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "article_bookmarks",
      filter: `article_id=eq.${articleId}`,
    }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

