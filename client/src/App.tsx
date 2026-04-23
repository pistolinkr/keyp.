/*
 * KEYP. APP ROUTER
 * Design: Sharp Editorial Intelligence
 * Routes: Feed, Post Detail, Editor, Profile, Search
 */
import { type ReactNode, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import MainLayout from "./components/layout/MainLayout";
import FeedPage from "./pages/FeedPage";
import PostDetailPage from "./pages/PostDetailPage";
import EditorPage from "./pages/EditorPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import LandingPage from "./pages/LandingPage";
import TroubleshootingPage from "./pages/TroubleshootingPage";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import AuthVerifyPage from "./pages/AuthVerifyPage";
import Custom from "./pages/Custom";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth/signin");
    }
  }, [loading, setLocation, user]);

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

function RequireOnboarded({ children }: { children: ReactNode }) {
  const { user, loading, profileOnboarding } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    if (user.isLocalDev) return;
    if (profileOnboarding.loading) return;
    if (!profileOnboarding.isOnboarded) {
      setLocation("/custom");
    }
  }, [loading, user, profileOnboarding.loading, profileOnboarding.isOnboarded, setLocation]);

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }
  if (!user) {
    return null;
  }
  if (!user.isLocalDev && (profileOnboarding.loading || !profileOnboarding.isOnboarded)) {
    return <div className="min-h-screen bg-background" />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth/signin" component={AuthPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/auth/verify" component={AuthVerifyPage} />
      <Route path="/auth">{() => <Redirect to="/auth/signin" />}</Route>
      <Route path="/custom">
        {() => (
          <RequireAuth>
            <Custom />
          </RequireAuth>
        )}
      </Route>
      <Route path="/feed">
        {() => (
          <RequireAuth>
            <RequireOnboarded>
              <MainLayout>
                <FeedPage />
              </MainLayout>
            </RequireOnboarded>
          </RequireAuth>
        )}
      </Route>
      <Route path="/post/:id">
        {(params) => (
          <RequireAuth>
            <RequireOnboarded>
              <MainLayout>
                <PostDetailPage id={params.id} />
              </MainLayout>
            </RequireOnboarded>
          </RequireAuth>
        )}
      </Route>
      <Route path="/write">
        {() => (
          <RequireAuth>
            <RequireOnboarded>
              <MainLayout>
                <EditorPage />
              </MainLayout>
            </RequireOnboarded>
          </RequireAuth>
        )}
      </Route>
      <Route path="/profile/:username">
        {(params) => (
          <RequireAuth>
            <RequireOnboarded>
              <MainLayout>
                <ProfilePage username={params.username} />
              </MainLayout>
            </RequireOnboarded>
          </RequireAuth>
        )}
      </Route>
      <Route path="/search">
        {() => (
          <RequireAuth>
            <RequireOnboarded>
              <MainLayout>
                <SearchPage />
              </MainLayout>
            </RequireOnboarded>
          </RequireAuth>
        )}
      </Route>
      <Route path="/season/:id">{() => <Redirect to="/feed" />}</Route>
      <Route path="/seasons">{() => <Redirect to="/feed" />}</Route>
      <Route path="/guide4-stuck-man" component={TroubleshootingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <LanguageProvider defaultLanguage="ko">
          <AuthProvider>
            <TooltipProvider>
              <Toaster position="bottom-right" />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
