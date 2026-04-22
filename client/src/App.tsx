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

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth/signin" component={AuthPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/auth/verify" component={AuthVerifyPage} />
      <Route path="/auth">{() => <Redirect to="/auth/signin" />}</Route>
      <Route path="/feed">
        {() => (
          <RequireAuth>
            <MainLayout>
              <FeedPage />
            </MainLayout>
          </RequireAuth>
        )}
      </Route>
      <Route path="/post/:id">
        {(params) => (
          <RequireAuth>
            <MainLayout>
              <PostDetailPage id={params.id} />
            </MainLayout>
          </RequireAuth>
        )}
      </Route>
      <Route path="/write">
        {() => (
          <RequireAuth>
            <MainLayout>
              <EditorPage />
            </MainLayout>
          </RequireAuth>
        )}
      </Route>
      <Route path="/profile/:username">
        {(params) => (
          <RequireAuth>
            <MainLayout>
              <ProfilePage username={params.username} />
            </MainLayout>
          </RequireAuth>
        )}
      </Route>
      <Route path="/search">
        {() => (
          <RequireAuth>
            <MainLayout>
              <SearchPage />
            </MainLayout>
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
