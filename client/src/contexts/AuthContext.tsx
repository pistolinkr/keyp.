import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const LOCAL_DEV_LOGIN_KEY = "keyp.local.dev.login";

/** 로컬 `.env.local` 전용. 프로덕션 빌드에는 설정하지 마세요. */
export function getConfiguredDevBypassEmail(): string {
  return (
    (import.meta.env.VITE_DEV_USER_EMAIL as string | undefined)?.trim().toLowerCase() ??
    ""
  );
}

export interface AppAuthUser {
  id: string;
  email: string | null;
  userMetadata: Record<string, unknown>;
  emailConfirmedAt: string | null;
  isLocalDev: boolean;
}

interface AuthContextType {
  user: AppAuthUser | null;
  session: Session | null;
  loading: boolean;
  profileUsername: string;
  /** Supabase profile onboarding flag; true for guests, local dev, or when loaded and `profiles.is_onboarded` is true. */
  profileOnboarding: { loading: boolean; isOnboarded: boolean };
  refreshProfileOnboarding: () => Promise<void>;
  signInLocalDev: (email: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const getProfileUsername = (user: AppAuthUser | null): string => {
  if (!user) return "guest";
  const metadataUsername = user.userMetadata?.username;
  if (typeof metadataUsername === "string" && metadataUsername.trim().length > 0) {
    return metadataUsername.trim();
  }
  const emailPrefix = user.email?.split("@")[0]?.trim();
  if (emailPrefix) return emailPrefix;
  return user.id.slice(0, 8);
};

const toAppAuthUser = (session: Session | null): AppAuthUser | null => {
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    userMetadata:
      typeof session.user.user_metadata === "object" && session.user.user_metadata
        ? session.user.user_metadata
        : {},
    emailConfirmedAt: session.user.email_confirmed_at ?? null,
    isLocalDev: false,
  };
};

const createLocalDevUser = (email: string): AppAuthUser => {
  const localPart = email.split("@")[0]?.trim() || "dev";
  return {
    id: "local-dev-user",
    email,
    userMetadata: {
      username: localPart,
      full_name: "Local Dev",
    },
    emailConfirmedAt: new Date().toISOString(),
    isLocalDev: true,
  };
};

const readLocalDevUserFromStorage = (): AppAuthUser | null => {
  const allowed = getConfiguredDevBypassEmail();
  if (!allowed) return null;
  if (typeof window === "undefined") return null;
  try {
    if (window.localStorage.getItem(LOCAL_DEV_LOGIN_KEY) !== "1") return null;
  } catch {
    return null;
  }
  return createLocalDevUser(allowed);
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [localDevUser, setLocalDevUser] = useState<AppAuthUser | null>(() =>
    readLocalDevUserFromStorage(),
  );
  const [profileOnboarding, setProfileOnboarding] = useState<{
    loading: boolean;
    isOnboarded: boolean;
  }>({ loading: true, isOnboarded: false });

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Failed to load Supabase session:", error.message);
      }
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    };

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!getConfiguredDevBypassEmail() && window.localStorage.getItem(LOCAL_DEV_LOGIN_KEY) === "1") {
        window.localStorage.removeItem(LOCAL_DEV_LOGIN_KEY);
        setLocalDevUser(null);
      }
    } catch {
      setLocalDevUser(null);
    }
  }, []);

  const signInLocalDev = useCallback((email: string) => {
    const allowed = getConfiguredDevBypassEmail();
    const normalized = email.trim().toLowerCase();
    if (!allowed || normalized !== allowed) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LOCAL_DEV_LOGIN_KEY, "1");
    } catch {
      return;
    }
    setLocalDevUser(createLocalDevUser(normalized));
  }, []);

  const loadProfileOnboarding = useCallback(async (userId: string | null, isLocal: boolean) => {
    if (!userId || isLocal) {
      setProfileOnboarding({ loading: false, isOnboarded: true });
      return;
    }
    setProfileOnboarding({ loading: true, isOnboarded: false });
    const { data, error } = await supabase
      .from("profiles")
      .select("is_onboarded")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("Failed to load profile onboarding flag:", error.message);
      setProfileOnboarding({ loading: false, isOnboarded: true });
      return;
    }
    const done = (data as { is_onboarded?: boolean } | null)?.is_onboarded === true;
    setProfileOnboarding({ loading: false, isOnboarded: done });
  }, []);

  useEffect(() => {
    const u = toAppAuthUser(session) || localDevUser;
    if (!u) {
      setProfileOnboarding({ loading: false, isOnboarded: true });
      return;
    }
    void loadProfileOnboarding(u.id, u.isLocalDev);
  }, [session?.user?.id, localDevUser?.id, localDevUser?.isLocalDev, loadProfileOnboarding]);

  const refreshProfileOnboarding = useCallback(async () => {
    const u = toAppAuthUser(session) || localDevUser;
    await loadProfileOnboarding(u?.id ?? null, Boolean(u?.isLocalDev));
  }, [session, localDevUser, loadProfileOnboarding]);

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(LOCAL_DEV_LOGIN_KEY);
      } catch {
        // Ignore storage failures.
      }
    }
    setLocalDevUser(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextType>(() => {
    const user = toAppAuthUser(session) || localDevUser;
    return {
      user,
      session,
      loading,
      profileUsername: getProfileUsername(user),
      profileOnboarding,
      refreshProfileOnboarding,
      signInLocalDev,
      signOut,
    };
  }, [
    loading,
    localDevUser,
    profileOnboarding,
    refreshProfileOnboarding,
    session,
    signInLocalDev,
    signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
