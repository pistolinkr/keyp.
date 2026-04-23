import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PLACEHOLDER_AVATAR } from "@/lib/mockData";
import {
  ensureMyProfileRow,
  getMyProfileFromSupabase,
  updateMyProfile,
  uploadAvatarFile,
  upsertOnboardingSurveyAnswers,
} from "@/lib/contentApi";
import { isSupabaseConfigured } from "@/lib/supabase";

const Q_USAGE = "onboarding_usage";
const Q_INTERESTS = "onboarding_interests";
const Q_DISCOVERY = "onboarding_discovery";

const USAGE_OPTIONS = [
  { key: "learn", ko: "배우고 인사이트 얻기", en: "Learn & get insights" },
  { key: "share", ko: "지식·경험 공유", en: "Share knowledge" },
  { key: "network", ko: "동료·커뮤니티 연결", en: "Connect with others" },
  { key: "explore", ko: "플랫폼 둘러보기", en: "Explore the platform" },
] as const;

const DISCOVERY_OPTIONS = [
  { key: "friend", ko: "지인 추천", en: "Friend referral" },
  { key: "social", ko: "SNS·커뮤니티", en: "Social / community" },
  { key: "search", ko: "검색", en: "Search engine" },
  { key: "other", ko: "기타", en: "Other" },
] as const;

export default function Custom() {
  const { lang } = useLanguage();
  const { user, profileOnboarding, refreshProfileOnboarding } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [bootLoading, setBootLoading] = useState(true);
  const [usageKey, setUsageKey] = useState<string>(USAGE_OPTIONS[0].key);
  const [interests, setInterests] = useState("");
  const [discoveryKey, setDiscoveryKey] = useState<string>(DISCOVERY_OPTIONS[0].key);
  const [activityName, setActivityName] = useState("");
  const [bio, setBio] = useState("");
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    if (user?.isLocalDev) {
      setLocation("/feed");
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (!profileOnboarding.loading && profileOnboarding.isOnboarded) {
      setLocation("/feed");
    }
  }, [profileOnboarding.loading, profileOnboarding.isOnboarded, setLocation]);

  useEffect(() => {
    if (!user || user.isLocalDev || !isSupabaseConfigured()) {
      setBootLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      await ensureMyProfileRow();
      if (cancelled) return;
      const me = await getMyProfileFromSupabase();
      if (cancelled) return;
      if (me?.isOnboarded) {
        setLocation("/feed");
        return;
      }
      if (me) {
        setActivityName(me.displayName?.trim() || "");
        setBio((me.bio || "").trim());
      }
      setBootLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setLocation]);

  const onPickAvatar = (file: File | null) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(
        lang === "ko" ? "JPEG, PNG, WebP 이미지만 업로드할 수 있어요." : "Only JPEG, PNG, or WebP images.",
      );
      return;
    }
    setPendingAvatar(file);
    const url = URL.createObjectURL(file);
    setAvatarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = activityName.trim();
    if (!trimmedName) {
      setNameError(
        lang === "ko" ? "활동 이름을 입력해 주세요." : "Activity name is required.",
      );
      return;
    }
    setNameError(null);
    setSubmitting(true);

    try {
      const survey = [
        { question_key: Q_USAGE, answer: usageKey },
        { question_key: Q_INTERESTS, answer: interests },
        { question_key: Q_DISCOVERY, answer: discoveryKey },
      ];

      const surveyRes = await upsertOnboardingSurveyAnswers(survey);
      if (!surveyRes.ok) {
        toast.error(
          lang === "ko"
            ? `설문 저장에 실패했습니다: ${surveyRes.error}`
            : `Could not save survey: ${surveyRes.error}`,
        );
        setSubmitting(false);
        return;
      }

      let avatarUrl: string | undefined;
      if (pendingAvatar) {
        const up = await uploadAvatarFile(pendingAvatar);
        if (!up.ok) {
          toast.error(
            lang === "ko"
              ? `이미지 업로드 실패: ${up.error}`
              : `Image upload failed: ${up.error}`,
          );
          setSubmitting(false);
          return;
        }
        avatarUrl = up.publicUrl;
      }

      const bioTrim = bio.trim();
      const profileRes = await updateMyProfile({
        display_name: trimmedName,
        display_name_en: trimmedName,
        bio: bioTrim,
        bio_en: bioTrim,
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
        is_onboarded: true,
      });

      if (!profileRes.ok) {
        toast.error(
          lang === "ko"
            ? `프로필 저장에 실패했습니다: ${profileRes.error}`
            : `Could not update profile: ${profileRes.error}`,
        );
        setSubmitting(false);
        return;
      }

      await refreshProfileOnboarding();
      setSuccess(true);
      window.setTimeout(() => {
        setLocation("/feed");
      }, 1600);
    } catch (err) {
      console.error(err);
      toast.error(lang === "ko" ? "처리 중 오류가 났습니다." : "Something went wrong.");
      setSubmitting(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">
          {lang === "ko" ? "Supabase가 설정되지 않았습니다." : "Supabase is not configured."}
        </p>
      </div>
    );
  }

  if (
    user &&
    !user.isLocalDev &&
    (bootLoading || profileOnboarding.loading || profileOnboarding.isOnboarded)
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md border border-border p-8 bg-card text-center space-y-3">
          <p className="text-lg font-semibold">Keyp 설정이 적용됐어요!! 🎉</p>
          <p className="text-lg font-semibold">You&apos;re all Keyp!! 🎉</p>
          <p className="text-sm text-muted-foreground">
            {lang === "ko" ? "피드로 이동합니다…" : "Taking you to the feed…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10 md:py-16">
      <div className="max-w-lg mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {lang === "ko" ? "환영해요 👋 Keyp에 오신 걸 반가워요!" : "Welcome 👋 Great to have you on Keyp!"}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {lang === "ko"
              ? "간단한 설정으로 더 나은 경험을 시작해보세요."
              : "A quick setup helps us tailor your experience."}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="space-y-4 border border-border p-5 bg-card">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {lang === "ko" ? "설문 (서비스 개선)" : "Survey (help us improve)"}
            </h2>

            <div className="space-y-2">
              <Label className="font-mono text-xs">
                {lang === "ko" ? "주로 어떤 목적으로 사용하실 계획인가요?" : "What’s your main goal here?"}
              </Label>
              <div className="grid gap-2">
                {USAGE_OPTIONS.map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-2 cursor-pointer text-sm border border-border px-3 py-2 hover:bg-accent/40 has-[:checked]:border-primary"
                  >
                    <input
                      type="radio"
                      name="usage"
                      className="accent-primary"
                      checked={usageKey === opt.key}
                      onChange={() => setUsageKey(opt.key)}
                    />
                    <span>{lang === "ko" ? opt.ko : opt.en}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboarding-interests" className="font-mono text-xs">
                {lang === "ko" ? "관심 있는 주제나 키워드" : "Topics or keywords you care about"}
              </Label>
              <Textarea
                id="onboarding-interests"
                value={interests}
                onChange={(ev) => setInterests(ev.target.value)}
                rows={3}
                placeholder={lang === "ko" ? "예: 제품 디자인, 스타트업, 글쓰기…" : "e.g. product design, startups, writing…"}
                className="rounded-none resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboarding-discovery" className="font-mono text-xs">
                {lang === "ko" ? "Keyp를 어떻게 알게 되셨나요?" : "How did you hear about Keyp?"}
              </Label>
              <select
                id="onboarding-discovery"
                value={discoveryKey}
                onChange={(ev) => setDiscoveryKey(ev.target.value)}
                className="w-full h-10 px-3 border border-border bg-background text-sm rounded-none"
              >
                {DISCOVERY_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {lang === "ko" ? opt.ko : opt.en}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-4 border border-border p-5 bg-card">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {lang === "ko" ? "프로필" : "Profile"}
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="shrink-0">
                <img
                  src={avatarPreviewUrl || PLACEHOLDER_AVATAR}
                  alt=""
                  className="w-24 h-24 object-cover border border-border"
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="onboarding-avatar" className="font-mono text-xs text-muted-foreground">
                  {lang === "ko" ? "프로필 이미지" : "Profile image"}
                </Label>
                <input
                  ref={fileInputRef}
                  id="onboarding-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(ev) => onPickAvatar(ev.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {lang === "ko" ? "이미지 선택" : "Choose image"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboarding-display-name" className="font-mono text-xs">
                {lang === "ko" ? "활동 이름 (필수)" : "Activity name (required)"}
              </Label>
              <Input
                id="onboarding-display-name"
                value={activityName}
                onChange={(ev) => {
                  setActivityName(ev.target.value);
                  if (nameError) setNameError(null);
                }}
                className="rounded-none"
                autoComplete="nickname"
              />
              {nameError ? <p className="text-sm text-destructive">{nameError}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboarding-bio" className="font-mono text-xs text-muted-foreground">
                {lang === "ko" ? "소개 (선택)" : "Bio (optional)"}
              </Label>
              <Textarea
                id="onboarding-bio"
                value={bio}
                onChange={(ev) => setBio(ev.target.value)}
                rows={3}
                className="rounded-none resize-y"
              />
            </div>
          </section>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-none font-mono text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {lang === "ko" ? "저장 중…" : "Saving…"}
              </>
            ) : (
              <>
                커스텀 내용 적용하기 / Keep customizing
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
