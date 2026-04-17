/*
 * KEYP. APP ROUTER
 * Design: Sharp Editorial Intelligence
 * Routes: Feed, Post Detail, Editor, Profile, Search, Season Archive
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import MainLayout from "./components/layout/MainLayout";
import FeedPage from "./pages/FeedPage";
import PostDetailPage from "./pages/PostDetailPage";
import EditorPage from "./pages/EditorPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import SeasonPage from "./pages/SeasonPage";
import LandingPage from "./pages/LandingPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/feed">
        {() => (
          <MainLayout>
            <FeedPage />
          </MainLayout>
        )}
      </Route>
      <Route path="/post/:id">
        {(params) => (
          <MainLayout>
            <PostDetailPage id={params.id} />
          </MainLayout>
        )}
      </Route>
      <Route path="/write">
        {() => (
          <MainLayout>
            <EditorPage />
          </MainLayout>
        )}
      </Route>
      <Route path="/profile/:username">
        {(params) => (
          <MainLayout>
            <ProfilePage username={params.username} />
          </MainLayout>
        )}
      </Route>
      <Route path="/search">
        {() => (
          <MainLayout>
            <SearchPage />
          </MainLayout>
        )}
      </Route>
      <Route path="/season/:id">
        {(params) => (
          <MainLayout>
            <SeasonPage id={params.id} />
          </MainLayout>
        )}
      </Route>
      <Route path="/seasons">
        {() => (
          <MainLayout>
            <SeasonPage id="all" />
          </MainLayout>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <LanguageProvider defaultLanguage="ko">
          <TooltipProvider>
            <Toaster position="bottom-right" />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
