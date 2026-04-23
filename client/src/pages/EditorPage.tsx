/*
 * KEYP. EDITOR PAGE
 * Design: Sharp Editorial Intelligence
 * Layout: Full-width editor + Right AI panel (independent, non-invasive)
 * Features: Markdown editor, AI suggestions (manual apply only), bilingual fields
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { categories } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { invalidatePublishedPostsCache } from "@/lib/contentApi";
import { requestAiAssistant, requestAiSummary, requestAiTranslation } from "@/lib/aiApi";
import {
  ChevronLeft, Sparkles, X, Send, Check, Eye, EyeOff, Save, Globe, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import Editor, { type EditorHandle } from "@/components/editor/Editor";

interface AISuggestion {
  id: string;
  type: 'improve' | 'translate' | 'expand' | 'summarize';
  original: string;
  suggestion: string;
  applied: boolean;
  targetLang?: 'ko' | 'en';
  translatedTitle?: string;
  translatedContent?: string;
  proposedTitle?: string;
  proposedBody?: string;
}

type EditorSnapshot = {
  postingLang: "ko" | "en";
  title: string;
  titleEn: string;
  contentKo: string;
  contentEn: string;
  plainTextKo: string;
  plainTextEn: string;
};

type EditableArticleRow = {
  id: string;
  author_profile_id: string | null;
  author_username: string | null;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  original_lang: "ko" | "en";
  article_contents: Array<{
    locale: "ko" | "en";
    title: string;
    summary: string;
    content: string;
  }> | null;
  article_tags: Array<{
    locale: "ko" | "en";
    tag: string;
  }> | null;
};

export default function EditorPage() {
  const { lang: globalLang } = useLanguage();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [postingLang, setPostingLang] = useState<'ko' | 'en'>(globalLang);
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentKo, setContentKo] = useState('');
  const [contentEn, setContentEn] = useState('');
  /** Editor는 타이핑 중 부모 value를 다시 넣지 않음 — 외부에서 본문을 바꿀 때만 key로 리마운트 */
  const [editorBodyInstance, setEditorBodyInstance] = useState(0);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [tags, setTags] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadingExistingArticle, setLoadingExistingArticle] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(true);
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationStage, setTranslationStage] = useState<"idle" | "title" | "content">("idle");
  const [flashTitleField, setFlashTitleField] = useState(false);
  const [flashEditorField, setFlashEditorField] = useState(false);
  const editorRef = useRef<EditorHandle | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const suggestionsRef = useRef<AISuggestion[]>([]);
  const [plainTextKo, setPlainTextKo] = useState("");
  const [plainTextEn, setPlainTextEn] = useState("");
  const editArticleId = (() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("edit");
  })();
  const isEditMode = Boolean(editArticleId);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    {
      role: 'ai',
      text: postingLang === 'ko'
        ? '안녕하세요! 글쓰기를 도와드릴게요. 아래에 AI 제안이 표시됩니다. Apply 버튼을 눌러야만 내용이 반영됩니다.'
        : 'Hello! I can help with writing. AI suggestions appear below and are applied only when you click Apply.',
    },
  ]);
  const applySuggestion = (id: string) => {
    const suggestion = suggestionsRef.current.find((s) => s.id === id);
    if (!suggestion) return;

    if (suggestion.type === "translate") {
      if (!suggestion.targetLang) {
        toast.error(
          postingLang === "ko"
            ? "이 번역 카드는 구버전 데이터입니다. '번역 제안 생성'으로 새 카드를 만든 뒤 Apply 해주세요."
            : "This is a legacy translate card. Generate a new translation suggestion and apply it.",
        );
        return;
      }
      const translatedTitle = suggestion.translatedTitle?.trim() ?? "";
      const translatedContent = suggestion.translatedContent?.trim() ?? "";
      if (!translatedTitle && !translatedContent) {
        toast.error(postingLang === "ko" ? "번역 결과가 비어 있습니다" : "Translation result is empty");
        return;
      }

      const snapshot = captureSnapshot();
      if (suggestion.targetLang === "ko") {
        if (translatedTitle) setTitle(translatedTitle);
        if (translatedContent) {
          setPlainTextKo(translatedContent);
          setContentKo(textToHtml(translatedContent));
          setEditorBodyInstance((n) => n + 1);
        }
      } else {
        if (translatedTitle) setTitleEn(translatedTitle);
        if (translatedContent) {
          setPlainTextEn(translatedContent);
          setContentEn(textToHtml(translatedContent));
          setEditorBodyInstance((n) => n + 1);
        }
      }

      setPostingLang(suggestion.targetLang);
      setFlashTitleField(true);
      setFlashEditorField(true);
      window.setTimeout(() => setFlashTitleField(false), 1200);
      window.setTimeout(() => setFlashEditorField(false), 1200);

      pushUndoSnapshot(snapshot);
      setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, applied: true } : s)));
      toast(postingLang === "ko" ? "번역이 반대 언어 필드에 적용되었습니다" : "Translation applied to opposite language fields");
      return;
    }

    const snapshot = captureSnapshot();
    const parsed = parseStructuredSuggestion(suggestion.suggestion);
    const nextTitle = (suggestion.proposedTitle ?? parsed.title).trim();
    const nextBodyRaw = (suggestion.proposedBody ?? parsed.body).trim();
    if (!nextBodyRaw && !nextTitle) {
      toast.error(postingLang === "ko" ? "적용할 텍스트가 없습니다" : "No text to apply");
      return;
    }
    const nextBodyHtml = nextBodyRaw.includes("<") ? nextBodyRaw : textToHtml(nextBodyRaw);
    const nextBodyText = nextBodyRaw.includes("<") ? htmlToPlainText(nextBodyRaw) : nextBodyRaw;

    if (postingLang === "ko") {
      if (nextTitle) setTitle(nextTitle);
      if (nextBodyRaw) {
        setContentKo(nextBodyHtml);
        setPlainTextKo(nextBodyText);
        setEditorBodyInstance((n) => n + 1);
      }
    } else {
      if (nextTitle) setTitleEn(nextTitle);
      if (nextBodyRaw) {
        setContentEn(nextBodyHtml);
        setPlainTextEn(nextBodyText);
        setEditorBodyInstance((n) => n + 1);
      }
    }

    setFlashTitleField(true);
    setFlashEditorField(true);
    window.setTimeout(() => setFlashTitleField(false), 1200);
    window.setTimeout(() => setFlashEditorField(false), 1200);

    pushUndoSnapshot(snapshot);
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, applied: true } : s)));
    toast(postingLang === "ko" ? "제목/본문에 각각 적용되었습니다" : "Applied to title/body");
  };

  const currentContent = postingLang === "ko" ? contentKo : contentEn;
  const currentPlainText = postingLang === "ko" ? plainTextKo : plainTextEn;

  useEffect(() => {
    if (!isEditMode || !editArticleId) {
      setLoadingExistingArticle(false);
      return;
    }
    if (!user) return;

    let cancelled = false;
    setLoadingExistingArticle(true);

    (async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(
          `
          id,
          author_profile_id,
          author_username,
          category,
          difficulty,
          original_lang,
          article_contents (locale, title, summary, content),
          article_tags (locale, tag)
        `,
        )
        .eq("id", editArticleId)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        toast.error(globalLang === "ko" ? "수정할 글을 찾을 수 없습니다." : "Could not find the post to edit.");
        setLocation("/feed");
        return;
      }

      const row = data as EditableArticleRow;
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      const usernameMatch =
        myProfile?.username &&
        row.author_username &&
        myProfile.username.trim().toLowerCase() === row.author_username.trim().toLowerCase();
      const allowed =
        row.author_profile_id === user.id ||
        (!row.author_profile_id && usernameMatch);
      if (!allowed) {
        toast.error(globalLang === "ko" ? "본인 글만 수정할 수 있습니다." : "You can edit only your own posts.");
        setLocation(`/post/${editArticleId}`);
        return;
      }

      const ko = row.article_contents?.find((item) => item.locale === "ko");
      const en = row.article_contents?.find((item) => item.locale === "en");
      const tagValues = Array.from(new Set((row.article_tags ?? []).map((t) => t.tag.trim()).filter(Boolean)));

      setPostingLang(row.original_lang === "en" ? "en" : "ko");
      setCategory(row.category);
      setDifficulty(row.difficulty);
      setTitle(ko?.title ?? "");
      setTitleEn(en?.title ?? "");
      setContentKo(ko?.content ?? "");
      setContentEn(en?.content ?? "");
      setPlainTextKo(htmlToPlainText(ko?.content ?? ""));
      setPlainTextEn(htmlToPlainText(en?.content ?? ""));
      setTags(tagValues.join(", "));
      setEditorBodyInstance((n) => n + 1);
      setLoadingExistingArticle(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [editArticleId, globalLang, isEditMode, setLocation, user]);

  useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  const captureSnapshot = (): EditorSnapshot => ({
    postingLang,
    title,
    titleEn,
    contentKo,
    contentEn,
    plainTextKo,
    plainTextEn,
  });

  const pushUndoSnapshot = (snapshot: EditorSnapshot) => {
    setUndoStack((prev) => [snapshot, ...prev].slice(0, 20));
  };

  const handleUndoLastApply = () => {
    const top = undoStack[0];
    if (!top) {
      toast(postingLang === "ko" ? "되돌릴 적용 내역이 없습니다." : "No applied change to undo.");
      return;
    }
    setPostingLang(top.postingLang);
    setTitle(top.title);
    setTitleEn(top.titleEn);
    setContentKo(top.contentKo);
    setContentEn(top.contentEn);
    setPlainTextKo(top.plainTextKo);
    setPlainTextEn(top.plainTextEn);
    setEditorBodyInstance((n) => n + 1);
    setUndoStack((prev) => prev.slice(1));
    toast(postingLang === "ko" ? "마지막 AI 적용을 되돌렸습니다." : "Undid last AI apply.");
  };

  const enqueueSuggestion = (suggestion: AISuggestion, options?: { forceApply?: boolean }) => {
    suggestionsRef.current = [suggestion, ...suggestionsRef.current];
    setSuggestions((prev) => {
      const next = [suggestion, ...prev];
      suggestionsRef.current = next;
      return next;
    });
    if (autoApplyEnabled || options?.forceApply) {
      window.setTimeout(() => applySuggestion(suggestion.id), 0);
    }
  };

  const textToHtml = (text: string) =>
    text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
      .join("");

  const htmlToPlainText = (html: string) =>
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();

  const parseStructuredSuggestion = (raw: string): { title: string; body: string } => {
    const text = raw.trim();
    const titleMatch = text.match(/(?:^|\n)\s*(?:TITLE|제목)\s*:\s*(.+)/i);
    const bodyMatch = text.match(/(?:^|\n)\s*(?:BODY|본문)\s*:\s*([\s\S]+)/i);
    const title = titleMatch?.[1]?.trim() ?? "";
    const body = bodyMatch?.[1]?.trim() ?? text;
    return { title, body };
  };

  const cleanupAssistantDraftText = (raw: string): string => {
    let text = raw.trim();
    text = text.replace(/^(?:A|Q)\s*-\s*/i, "");
    text = text.replace(/^(?:네|좋아요|물론(?:이죠|입니다)?|Sure|Absolutely)[!,. ]+/i, "");
    text = text.replace(/^(?:아래(?:의)?\s*내용(?:은|는)?\s*.*?(?:초본|draft)입니다\.?\s*)/i, "");
    text = text.replace(/\(\s*에디터.*?붙여넣기.*?가능.*?\)\s*$/i, "");
    return text.trim();
  };

  const shouldAutoPasteByUserMessage = (message: string): boolean =>
    /(붙여넣|반영|적용|삽입|paste|apply|insert)/i.test(message);

  const handlePostingLangSwitch = (nextLang: "ko" | "en") => {
    if (nextLang === postingLang) return;
    setPostingLang(nextLang);
  };

  const handleGenerateTranslation = async () => {
    if (aiBusy) return;
    if (!currentPlainText.trim() && !(postingLang === "ko" ? title : titleEn).trim()) {
      toast(postingLang === "ko" ? "번역할 제목/본문이 없습니다." : "No title/content to translate.");
      return;
    }

    const sourceLang = postingLang;
    const targetLang: "ko" | "en" = postingLang === "ko" ? "en" : "ko";
    const sourceTitle = sourceLang === "ko" ? title : titleEn;

    setAiBusy(true);
    setIsTranslating(true);
    setTranslationStage("title");
    try {
      const titleRes = sourceTitle.trim()
        ? await requestAiTranslation({ text: sourceTitle, sourceLang, targetLang })
        : { translatedText: "" };
      setTranslationStage("content");
      const contentRes = currentPlainText.trim()
        ? await requestAiTranslation({ text: currentPlainText, sourceLang, targetLang })
        : { translatedText: "" };

      const translatedTitle = titleRes.translatedText.trim();
      const translatedContent = contentRes.translatedText.trim();
      const preview = translatedContent || translatedTitle;

      enqueueSuggestion({
        id: `translate-${Date.now()}`,
        type: "translate",
        original: sourceLang === "ko" ? "현재 한국어 초안" : "Current English draft",
        suggestion: preview.length > 180 ? `${preview.slice(0, 177)}...` : preview,
        translatedTitle,
        translatedContent,
        targetLang,
        applied: false,
      });
      toast(targetLang === "ko" ? "한국어 번역 제안을 생성했습니다." : "Generated English translation suggestion.");
    } catch (error: any) {
      toast.error(
        postingLang === "ko"
          ? `번역 제안 생성 실패: ${error?.message ?? "알 수 없는 오류"}`
          : `Failed to generate translation suggestion: ${error?.message ?? "Unknown error"}`,
      );
    } finally {
      setTranslationStage("idle");
      setIsTranslating(false);
      setAiBusy(false);
    }
  };

  const handleGenerateDraftSuggestion = async (kind: "improve" | "expand") => {
    if (aiBusy) return;
    if (!currentPlainText.trim()) {
      toast(postingLang === "ko" ? "먼저 본문을 작성해주세요." : "Write some content first.");
      return;
    }

    const prompt =
      kind === "improve"
        ? postingLang === "ko"
          ? "현재 글을 개선해줘. 반드시 아래 형식으로만 답해줘.\nTITLE: <개선된 제목 1줄>\nBODY:\n<개선된 본문>"
          : "Improve this draft. Return strictly in this format:\nTITLE: <improved title>\nBODY:\n<improved body>"
        : postingLang === "ko"
          ? "현재 글을 확장해줘. 반드시 아래 형식으로만 답해줘.\nTITLE: <확장된 제목 1줄>\nBODY:\n<확장된 본문>"
          : "Expand this draft. Return strictly in this format:\nTITLE: <expanded title>\nBODY:\n<expanded body>";

    setAiBusy(true);
    try {
      const { reply } = await requestAiAssistant({
        message: prompt,
        content: currentPlainText,
        title: postingLang === "ko" ? title : titleEn,
        lang: postingLang,
        history: [],
      });
      const parsed = parseStructuredSuggestion(reply);
      enqueueSuggestion({
        id: `${kind}-${Date.now()}`,
        type: kind,
        original: postingLang === "ko" ? "현재 본문" : "Current draft",
        suggestion: parsed.body,
        proposedTitle: parsed.title,
        proposedBody: parsed.body,
        applied: false,
      });
      toast(
        kind === "improve"
          ? postingLang === "ko"
            ? "개선 제안을 생성했습니다."
            : "Improvement suggestion generated."
          : postingLang === "ko"
            ? "확장 제안을 생성했습니다."
            : "Expansion suggestion generated.",
      );
    } catch (error: any) {
      toast.error(
        postingLang === "ko"
          ? `제안 생성 실패: ${error?.message ?? "알 수 없는 오류"}`
          : `Failed to generate suggestion: ${error?.message ?? "Unknown error"}`,
      );
    } finally {
      setAiBusy(false);
    }
  };

  const handleAiSend = () => {
    void (async () => {
      if (!aiInput.trim() || aiBusy) return;
      const userMsg = aiInput.trim();
      setAiInput("");
      setAiBusy(true);
      setAiMessages((prev) => [...prev, { role: "user", text: userMsg }]);

      try {
        const history: Array<{ role: "user" | "assistant"; text: string }> = aiMessages
          .slice(-6)
          .map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            text: m.text,
          }));
        const { reply } = await requestAiAssistant({
          message: userMsg,
          content: currentPlainText,
          title: postingLang === "ko" ? title : titleEn,
          lang: postingLang,
          history,
        });
        const cleanedReply = cleanupAssistantDraftText(reply) || reply.trim();
        setAiMessages((prev) => [...prev, { role: "ai", text: cleanedReply }]);

        if (shouldAutoPasteByUserMessage(userMsg) && cleanedReply) {
          const parsed = parseStructuredSuggestion(cleanedReply);
          const body = (parsed.body || cleanedReply).trim();
          enqueueSuggestion(
            {
              id: `chat-${Date.now()}`,
              type: "improve",
              original: postingLang === "ko" ? "ASK AI 결과" : "ASK AI result",
              suggestion: body,
              proposedTitle: parsed.title.trim() || undefined,
              proposedBody: body,
              applied: false,
            },
            { forceApply: true },
          );
          toast(postingLang === "ko" ? "AI 생성 내용을 에디터에 자동 반영했습니다." : "Auto-applied AI content to editor.");
        }
      } catch (error: any) {
        setAiMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text:
              postingLang === "ko"
                ? `AI 요청 실패: ${error?.message ?? "알 수 없는 오류"}`
                : `AI request failed: ${error?.message ?? "Unknown error"}`,
          },
        ]);
      } finally {
        setAiBusy(false);
      }
    })();
  };

  const handleGenerateSummary = async () => {
    if (!currentPlainText.trim() || aiBusy) {
      if (!currentPlainText.trim()) {
        toast(postingLang === "ko" ? "먼저 본문을 작성해주세요." : "Write some content first.");
      }
      return;
    }
    setAiBusy(true);
    try {
      const { summary } = await requestAiSummary({
        content: currentPlainText,
        lang: postingLang,
      });
      const baseTitle = (postingLang === "ko" ? title : titleEn || title).trim();
      const summaryTitle =
        postingLang === "ko"
          ? `요약: ${baseTitle || "제목 없음"}`.slice(0, 80)
          : `Summary: ${baseTitle || "Untitled"}`.slice(0, 80);
      enqueueSuggestion({
        id: `summary-${Date.now()}`,
        type: "summarize",
        original: postingLang === "ko" ? "현재 본문" : "Current draft",
        suggestion: summary,
        proposedTitle: summaryTitle,
        proposedBody: summary,
        applied: false,
      });
      toast(postingLang === "ko" ? "AI 요약을 생성했습니다." : "AI summary generated.");
    } catch (error: any) {
      toast.error(
        postingLang === "ko"
          ? `요약 실패: ${error?.message ?? "알 수 없는 오류"}`
          : `Summary failed: ${error?.message ?? "Unknown error"}`,
      );
    } finally {
      setAiBusy(false);
    }
  };

  const wordCount = currentPlainText.split(/\s+/).filter(Boolean).length;
  const charCount = currentPlainText.length;

  const makeSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9가-힣\s-]/g, " ")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const summarize = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return "";
    return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
  };

  const getReadTime = (text: string) => {
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
  };

  const parseTags = (value: string) =>
    value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

  const handlePublish = async () => {
    if (!title.trim() || !plainTextKo.trim() || !category) {
      toast.error(globalLang === 'ko' ? '제목, 내용, 카테고리를 입력해주세요' : 'Please fill in title, content, and category');
      return;
    }

    if (!user) {
      toast.error(globalLang === "ko" ? "로그인이 필요합니다." : "Sign in required.");
      return;
    }

    if (user.isLocalDev) {
      toast.error(
        globalLang === "ko"
          ? "로컬 개발 우회 계정은 발행할 수 없습니다. 실제 계정으로 로그인해주세요."
          : "Local dev bypass user cannot publish. Please sign in with a real account.",
      );
      return;
    }

    setIsPublishing(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, display_name, display_name_en, avatar_url, level, xp, joined_season, is_verified, tags")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }
      if (!profile) {
        throw new Error(globalLang === "ko" ? "프로필을 찾을 수 없습니다." : "Profile not found.");
      }

      const koTitle = title.trim();
      const enTitle = titleEn.trim() || koTitle;
      const koContent = contentKo;
      const enContent = contentEn || contentKo;
      const koSummary = summarize(plainTextKo);
      const enSummary = summarize(plainTextEn) || koSummary;
      const nowIso = new Date().toISOString();
      const parsedTags = parseTags(tags);
      const targetArticleId = editArticleId ?? crypto.randomUUID();
      if (isEditMode) {
        const { error: updateError } = await supabase
          .from("articles")
          .update({
            author_profile_id: profile.id,
            category,
            author_username: profile.username,
            author_display_name: profile.display_name,
            author_display_name_en: profile.display_name_en || profile.display_name,
            author_avatar_url: profile.avatar_url || "/placeholder.svg",
            author_level: profile.level ?? 1,
            author_xp: profile.xp ?? 0,
            author_joined_season: profile.joined_season,
            author_is_verified: profile.is_verified ?? false,
            author_tags: profile.tags ?? [],
            seo_title: enTitle.slice(0, 70),
            seo_description: enSummary.slice(0, 160),
            original_lang: postingLang,
            read_time: getReadTime(postingLang === "ko" ? plainTextKo : plainTextEn || plainTextKo),
            difficulty,
            updated_at: nowIso,
          })
          .eq("id", targetArticleId);
        if (updateError) throw updateError;
      } else {
        const slugBase = makeSlug(enTitle || koTitle) || `post-${Date.now()}`;
        const slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`;
        const { error: articleError } = await supabase.from("articles").insert({
          id: targetArticleId,
          slug,
          category,
          author_profile_id: profile.id,
          legacy_author_id: null,
          author_username: profile.username,
          author_display_name: profile.display_name,
          author_display_name_en: profile.display_name_en || profile.display_name,
          author_avatar_url: profile.avatar_url || "/placeholder.svg",
          author_level: profile.level ?? 1,
          author_xp: profile.xp ?? 0,
          author_joined_season: profile.joined_season,
          author_is_verified: profile.is_verified ?? false,
          author_tags: profile.tags ?? [],
          status: "published",
          featured_image: null,
          published_at: nowIso,
          seo_title: enTitle.slice(0, 70),
          seo_description: enSummary.slice(0, 160),
          episode: 0,
          original_lang: postingLang,
          read_time: getReadTime(postingLang === "ko" ? plainTextKo : plainTextEn || plainTextKo),
          view_count: 0,
          upvote_count: 0,
          comment_count: 0,
          bookmark_count: 0,
          is_read_only: false,
          is_featured: false,
          difficulty,
        });
        if (articleError) throw articleError;
      }

      const { error: contentError } = await supabase.from("article_contents").upsert(
        [
          { article_id: targetArticleId, locale: "ko", title: koTitle, summary: koSummary, content: koContent },
          { article_id: targetArticleId, locale: "en", title: enTitle, summary: enSummary, content: enContent },
        ],
        { onConflict: "article_id,locale" },
      );
      if (contentError) throw contentError;

      const { error: clearTagsError } = await supabase
        .from("article_tags")
        .delete()
        .eq("article_id", targetArticleId);
      if (clearTagsError) throw clearTagsError;

      if (parsedTags.length > 0) {
        const tagRows = [
          ...parsedTags.map((tag) => ({ article_id: targetArticleId, locale: "ko" as const, tag })),
          ...parsedTags.map((tag) => ({ article_id: targetArticleId, locale: "en" as const, tag })),
        ];
        const { error: tagError } = await supabase.from("article_tags").insert(tagRows);
        if (tagError) throw tagError;
      }

      invalidatePublishedPostsCache();
      toast.success(
        isEditMode
          ? (globalLang === "ko" ? "게시글이 수정되었습니다!" : "Post updated!")
          : (globalLang === "ko" ? "게시글이 발행되었습니다!" : "Post published!"),
      );
      setLocation(`/post/${targetArticleId}`);
    } catch (error: any) {
      console.error("publishPost:", error);
      toast.error(
        globalLang === "ko"
          ? `발행 실패: ${error?.message ?? "알 수 없는 오류"}`
          : `Publish failed: ${error?.message ?? "Unknown error"}`,
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ─── EDITOR MAIN ─── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Editor header */}
        <div className="sticky top-[4.5rem] z-30 bg-background border-b border-border flex items-center gap-3 px-6 py-3">
          <Link href="/feed">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={16} />
              {globalLang === 'ko' ? '취소' : 'Cancel'}
            </button>
          </Link>

          <div className="flex-1" />

          {/* Preview toggle */}
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs transition-colors ${
              showPreview ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            }`}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            {globalLang === 'ko' ? '미리보기' : 'Preview'}
          </button>

          {/* Save draft */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            onClick={() => toast(globalLang === 'ko' ? '임시저장 완료' : 'Draft saved')}
          >
            <Save size={13} />
            {globalLang === 'ko' ? '임시저장' : 'Save Draft'}
          </button>

          {/* Publish */}
          <button
            className="keyp-btn-primary flex items-center gap-1.5 text-xs px-4 py-1.5"
            onClick={handlePublish}
            disabled={isPublishing || loadingExistingArticle}
          >
            <Check size={13} />
            {loadingExistingArticle
              ? (globalLang === "ko" ? "불러오는 중..." : "Loading...")
              : isPublishing
                ? (isEditMode
                    ? (globalLang === "ko" ? "수정 중..." : "Updating...")
                    : (globalLang === "ko" ? "발행 중..." : "Publishing..."))
                : (isEditMode
                    ? (globalLang === "ko" ? "수정하기" : "Update")
                    : (globalLang === "ko" ? "발행하기" : "Publish"))}
          </button>
        </div>

        {/* Editor body */}
        <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
          {/* Language tabs for bilingual fields */}
          <div className="flex items-center gap-3 mb-6">
            <div className="keyp-lang-toggle">
              <button className={postingLang === 'ko' ? 'active' : ''} onClick={() => void handlePostingLangSwitch('ko')}>KO</button>
              <button className={postingLang === 'en' ? 'active' : ''} onClick={() => void handlePostingLangSwitch('en')}>EN</button>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe size={12} />
              <span className="font-mono">
                {postingLang === 'ko' ? '한국어로 작성 중' : 'Writing in English'}
              </span>
              {isTranslating && (
                <span className="font-mono text-primary">
                  · {translationStage === "title"
                    ? (postingLang === "ko" ? "제목 번역 중..." : "Translating title...")
                    : (postingLang === "ko" ? "본문 번역 중..." : "Translating body...")}
                </span>
              )}
            </div>
          </div>

          {/* Title input */}
          <div className="mb-4">
            {isEditMode && (
              <p className="font-mono text-xs text-muted-foreground mb-2">
                {globalLang === "ko" ? "수정 모드" : "Edit mode"} · ID {editArticleId}
              </p>
            )}
            <input
              type="text"
              value={postingLang === 'ko' ? title : titleEn}
              onChange={(e) => postingLang === 'ko' ? setTitle(e.target.value) : setTitleEn(e.target.value)}
              placeholder={postingLang === 'ko' ? '제목을 입력하세요...' : 'Enter title...'}
              className={`w-full bg-transparent border-b-2 focus:border-foreground text-2xl md:text-3xl font-black py-3 focus:outline-none transition-colors placeholder:text-muted-foreground/50 ${
                flashTitleField || (isTranslating && translationStage === "title")
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
              style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.03em' }}
            />
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-border">
            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-muted border border-border px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
            >
              <option value="">{postingLang === 'ko' ? '카테고리 선택' : 'Select Category'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {postingLang === 'ko' ? cat.label : cat.labelEn}
                </option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="bg-muted border border-border px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
            >
              <option value="beginner">{postingLang === 'ko' ? '입문' : 'Beginner'}</option>
              <option value="intermediate">{postingLang === 'ko' ? '중급' : 'Intermediate'}</option>
              <option value="advanced">{postingLang === 'ko' ? '심화' : 'Advanced'}</option>
            </select>

            {/* Tags */}
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={postingLang === 'ko' ? '태그 (쉼표로 구분)' : 'Tags (comma separated)'}
              className="flex-1 min-w-32 bg-muted border border-border px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 mb-3 pb-3 border-b border-border">
            <button
              className={`p-2 transition-colors ${
                showAI
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              onClick={() => setShowAI(!showAI)}
              title={postingLang === 'ko' ? 'AI 보조 패널 열기/닫기' : 'Toggle AI Assistant'}
            >
              <Sparkles size={15} />
            </button>
            <div className="flex-1" />
            <span className="font-mono text-xs text-muted-foreground">
              {wordCount} words · {charCount} chars
            </span>
          </div>

          {/* Content area */}
          {showPreview ? (
            <div
              className="prose-keyp min-h-64"
              dangerouslySetInnerHTML={{
                __html: currentContent || `<p class="text-muted-foreground">${postingLang === 'ko' ? '내용을 입력하면 미리보기가 표시됩니다.' : 'Preview will appear when you start writing.'}</p>`,
              }}
            />
          ) : (
            <div className={`transition-colors ${flashEditorField || (isTranslating && translationStage === "content") ? "ring-1 ring-primary/70 bg-primary/5" : ""}`}>
              <Editor
                key={`${postingLang}-${editorBodyInstance}`}
                ref={editorRef}
                value={currentContent}
                onChange={(html, text) => {
                  if (postingLang === "ko") {
                    setContentKo(html);
                    setPlainTextKo(text);
                  } else {
                    setContentEn(html);
                    setPlainTextEn(text);
                  }
                }}
              />
            </div>
          )}

          {/* Writing tips */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="keyp-section-label mb-3">WRITING GUIDE</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  title: postingLang === 'ko' ? '구조화된 글쓰기' : 'Structured Writing',
                  desc: postingLang === 'ko' ? '## 헤딩으로 섹션을 명확히 구분하세요' : 'Use ## headings to clearly divide sections'
                },
                {
                  title: postingLang === 'ko' ? '이중 언어 지원' : 'Bilingual Support',
                  desc: postingLang === 'ko' ? 'KO/EN 탭으로 두 언어 버전을 작성하세요' : 'Write both language versions with KO/EN tabs'
                },
                {
                  title: postingLang === 'ko' ? 'AI 어시스턴트' : 'AI Assistant',
                  desc: postingLang === 'ko' ? 'AI 제안은 Apply 버튼으로만 적용됩니다' : 'AI suggestions apply only via the Apply button'
                },
              ].map((tip, i) => (
                <div key={i} className="p-3 bg-muted border border-border">
                  <div className="text-xs font-semibold mb-1">{tip.title}</div>
                  <div className="font-mono text-xs text-muted-foreground">{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── AI PANEL ─── */}
      {showAI && (
        <div className="hidden lg:flex flex-col w-80 shrink-0 sticky top-[4.5rem] h-[calc(100vh-72px)] border-l border-border bg-card animate-slide-in-right">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-primary" />
              <span className="text-sm font-semibold">
                {postingLang === 'ko' ? 'AI 글쓰기 보조' : 'AI Write Assistant'}
              </span>
            </div>
            <button
              className="p-1 hover:bg-accent transition-colors text-muted-foreground"
              onClick={() => setShowAI(false)}
            >
              <X size={15} />
            </button>
          </div>

          {/* Non-invasive notice */}
          <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
            <p className="font-mono text-xs text-amber-700 dark:text-amber-400">
              ⚠ {postingLang === 'ko'
                ? 'AI 제안은 자동 반영되지 않습니다. Apply 버튼으로만 적용됩니다.'
                : 'AI suggestions are NOT auto-applied. Use Apply button only.'}
            </p>
          </div>

          {/* Suggestions */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="keyp-section-label">AI SUGGESTIONS</p>
            <div className="flex items-center gap-2">
              <button
                className={`font-mono text-xs px-2.5 py-1 border transition-colors ${
                  autoApplyEnabled
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                }`}
                onClick={() => setAutoApplyEnabled((v) => !v)}
              >
                {autoApplyEnabled
                  ? (postingLang === "ko" ? "AUTO APPLY: ON" : "AUTO APPLY: ON")
                  : (postingLang === "ko" ? "AUTO APPLY: OFF" : "AUTO APPLY: OFF")}
              </button>
              <button
                className="font-mono text-xs px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center gap-1"
                onClick={handleUndoLastApply}
                disabled={undoStack.length === 0}
              >
                <RotateCcw size={11} />
                {postingLang === "ko" ? "Undo" : "Undo"}
              </button>
            </div>
            <button
              className="font-mono text-xs px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              onClick={() => void handleGenerateDraftSuggestion("improve")}
              disabled={aiBusy}
            >
              {postingLang === "ko" ? "개선 제안 생성" : "Generate Improve"}
            </button>
            <button
              className="font-mono text-xs px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors ml-2"
              onClick={() => void handleGenerateDraftSuggestion("expand")}
              disabled={aiBusy}
            >
              {postingLang === "ko" ? "확장 제안 생성" : "Generate Expand"}
            </button>
            <button
              className="font-mono text-xs px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors ml-2"
              onClick={handleGenerateSummary}
              disabled={aiBusy}
            >
              {postingLang === "ko" ? "본문 요약 생성" : "Generate Summary"}
            </button>
            <button
              className="font-mono text-xs px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors ml-2"
              onClick={handleGenerateTranslation}
              disabled={aiBusy}
            >
              {postingLang === "ko" ? "번역 제안 생성" : "Generate Translation"}
            </button>

            {suggestions.map((s) => (
              <div
                key={s.id}
                className={`border p-3 transition-colors ${
                  s.applied ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs px-1.5 py-0.5 ${
                    s.type === 'improve' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    s.type === 'translate' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    s.type === 'expand' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {s.type.toUpperCase()}
                  </span>
                  {s.applied ? (
                    <span className="flex items-center gap-1 font-mono text-xs text-green-600 dark:text-green-400">
                      <Check size={11} />
                      APPLIED
                    </span>
                  ) : (
                    <button
                      className="font-mono text-xs px-2.5 py-1 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={() => applySuggestion(s.id)}
                    >
                      Apply
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.suggestion}</p>
              </div>
            ))}

            {/* Chat messages */}
            <div className="keyp-divider my-3" />
            <p className="keyp-section-label">ASK AI</p>

            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'ai' && (
                  <div className="w-5 h-5 bg-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={10} className="text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[85%] px-2.5 py-2 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* AI input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                placeholder={postingLang === 'ko' ? 'AI에게 요청하세요...' : 'Ask AI...'}
                className="flex-1 bg-muted border border-border px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
              />
              <button
                className="keyp-btn-primary px-3 py-2"
                onClick={handleAiSend}
                disabled={!aiInput.trim() || aiBusy}
              >
                <Send size={13} />
              </button>
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-1.5">
              Ollama Local
            </p>
          </div>
        </div>
      )}
    </div>
  );

}
