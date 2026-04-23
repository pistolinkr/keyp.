import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

type Action =
  | "state"
  | "upvote_toggle"
  | "bookmark_toggle"
  | "comment_create"
  | "comment_delete"

type RequestBody = {
  action: Action
  articleId: string
  commentId?: string
  parentId?: string | null
  content?: string
  locale?: "ko" | "en"
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  })
}

function sanitizeContent(raw: string) {
  return raw.trim().replace(/\s+/g, " ")
}

async function getState(supabase: ReturnType<typeof createClient>, articleId: string, userId: string) {
  const [{ data: article }, { data: upvoted }, { data: bookmarked }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, upvote_count, comment_count, bookmark_count, updated_at")
      .eq("id", articleId)
      .maybeSingle(),
    supabase
      .from("article_upvotes")
      .select("article_id")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("article_bookmarks")
      .select("article_id")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .maybeSingle(),
  ])

  return {
    articleId,
    upvoted: Boolean(upvoted),
    bookmarked: Boolean(bookmarked),
    counters: {
      upvotes: article?.upvote_count ?? 0,
      comments: article?.comment_count ?? 0,
      bookmarks: article?.bookmark_count ?? 0,
      updatedAt: article?.updated_at ?? null,
    },
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS })
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  const url = Deno.env.get("SUPABASE_URL")
  const anon = Deno.env.get("SUPABASE_ANON_KEY")
  const authHeader = req.headers.get("Authorization")
  if (!url || !anon) {
    return json({ error: "missing_function_env" }, 500)
  }
  if (!authHeader) {
    return json({ error: "not_authenticated" }, 401)
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return json({ error: "not_authenticated" }, 401)
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return json({ error: "invalid_json" }, 400)
  }

  const action = body.action
  const articleId = body.articleId?.trim()
  if (!action || !articleId) {
    return json({ error: "action_and_articleId_required" }, 400)
  }

  try {
    if (action === "upvote_toggle") {
      const { data: existing, error: selectErr } = await supabase
        .from("article_upvotes")
        .select("article_id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle()
      if (selectErr) return json({ error: selectErr.message }, 400)

      if (existing) {
        const { error } = await supabase
          .from("article_upvotes")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", user.id)
        if (error) return json({ error: error.message }, 400)
      } else {
        const { error } = await supabase.from("article_upvotes").insert({ article_id: articleId, user_id: user.id })
        if (error) return json({ error: error.message }, 400)
      }
      await supabase.from("engagement_events").insert({
        article_id: articleId,
        actor_id: user.id,
        event_type: "upvote_toggle",
        payload: { active: !existing },
      })
    } else if (action === "bookmark_toggle") {
      const { data: existing, error: selectErr } = await supabase
        .from("article_bookmarks")
        .select("article_id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle()
      if (selectErr) return json({ error: selectErr.message }, 400)

      if (existing) {
        const { error } = await supabase
          .from("article_bookmarks")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", user.id)
        if (error) return json({ error: error.message }, 400)
      } else {
        const { error } = await supabase
          .from("article_bookmarks")
          .insert({ article_id: articleId, user_id: user.id })
        if (error) return json({ error: error.message }, 400)
      }
      await supabase.from("engagement_events").insert({
        article_id: articleId,
        actor_id: user.id,
        event_type: "bookmark_toggle",
        payload: { active: !existing },
      })
    } else if (action === "comment_create") {
      const raw = body.content ?? ""
      const content = sanitizeContent(raw)
      if (!content) return json({ error: "comment_content_required" }, 400)

      const locale = body.locale === "en" ? "en" : "ko"
      const parentId = body.parentId ?? null
      let depth = 0
      if (parentId) {
        const { data: parent, error: parentErr } = await supabase
          .from("comments")
          .select("depth")
          .eq("id", parentId)
          .eq("article_id", articleId)
          .maybeSingle()
        if (parentErr) return json({ error: parentErr.message }, 400)
        depth = (parent?.depth ?? 0) + 1
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("username, display_name, display_name_en, avatar_url, level, is_verified")
        .eq("id", user.id)
        .maybeSingle()
      if (profileErr || !profile) return json({ error: profileErr?.message ?? "profile_not_found" }, 400)

      const { data: inserted, error: insertErr } = await supabase
        .from("comments")
        .insert({
          article_id: articleId,
          parent_id: parentId,
          author_profile_id: user.id,
          author_username: profile.username,
          author_display_name: profile.display_name,
          author_display_name_en: profile.display_name_en || profile.display_name,
          author_avatar_url: profile.avatar_url || "/placeholder.svg",
          author_level: profile.level ?? 1,
          author_is_verified: profile.is_verified ?? false,
          content_ko: locale === "ko" ? content : "",
          content_en: locale === "en" ? content : "",
          original_lang: locale,
          depth,
          is_read_only: false,
        })
        .select("*")
        .single()

      if (insertErr) return json({ error: insertErr.message }, 400)

      await supabase.from("engagement_events").insert({
        article_id: articleId,
        actor_id: user.id,
        event_type: "comment_create",
        payload: { comment_id: inserted.id, depth, locale },
      })
    } else if (action === "comment_delete") {
      const commentId = body.commentId?.trim()
      if (!commentId) return json({ error: "comment_id_required" }, 400)

      const { data: existing, error: existingErr } = await supabase
        .from("comments")
        .select("id, article_id, author_profile_id, created_at")
        .eq("id", commentId)
        .eq("article_id", articleId)
        .maybeSingle()
      if (existingErr) return json({ error: existingErr.message }, 400)
      if (!existing) return json({ error: "comment_not_found" }, 404)

      if (!existing.author_profile_id || existing.author_profile_id !== user.id) {
        return json({ error: "comment_delete_forbidden" }, 403)
      }

      const createdAtMs = Date.parse(existing.created_at)
      if (Number.isNaN(createdAtMs)) {
        return json({ error: "comment_invalid_created_at" }, 400)
      }
      const elapsedMs = Date.now() - createdAtMs
      if (elapsedMs > 30 * 60 * 1000) {
        return json({ error: "comment_delete_window_expired" }, 403)
      }

      const { error: delErr } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("article_id", articleId)
      if (delErr) return json({ error: delErr.message }, 400)

      await supabase.from("engagement_events").insert({
        article_id: articleId,
        actor_id: user.id,
        event_type: "comment_delete",
        payload: { comment_id: commentId },
      })
    } else if (action !== "state") {
      return json({ error: "unsupported_action" }, 400)
    }

    const state = await getState(supabase, articleId, user.id)
    return json({ ok: true, action, ...state })
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error"
    return json({ error: message }, 500)
  }
})
