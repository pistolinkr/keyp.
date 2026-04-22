import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  lang: "ko" | "en";
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, lang: "ko" };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, error.stack, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const errorCode = "STUCK-MAN-0001";
      const isKo = this.state.lang === "ko";
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <header className="h-14 border-b border-border flex items-center justify-between px-6">
            <img src="/logo.png" alt="Keyp. logo" className="h-7 w-auto object-contain" />
            <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
              <button
                type="button"
                onClick={() => this.setState({ lang: "ko" })}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isKo ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                KO
              </button>
              <button
                type="button"
                onClick={() => this.setState({ lang: "en" })}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isKo ? "text-muted-foreground hover:bg-accent" : "bg-foreground text-background"
                }`}
              >
                EN
              </button>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-md w-full">
              <div className="flex items-start gap-4 mb-8">
                <div className="flex flex-col items-center gap-3 flex-shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/guide4-stuck-man?code=${encodeURIComponent(errorCode)}`;
                    }}
                    className="w-12 h-12 border border-destructive flex items-center justify-center text-destructive transition hover:bg-destructive/10"
                    aria-label={isKo ? "guide4-stuck-man 페이지" : "guide4-stuck-man page"}
                    title="guide4-stuck-man"
                  >
                    <AlertTriangle size={22} strokeWidth={1.5} className="text-destructive" />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-yellow-400 bg-transparent text-yellow-400 transition hover:bg-yellow-400/10"
                    aria-label={isKo ? "새로고침" : "Reload"}
                    title={isKo ? "새로고침" : "Reload"}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/";
                    }}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-emerald-500 bg-transparent text-emerald-500 transition hover:bg-emerald-500/10"
                    aria-label={isKo ? "홈페이지" : "Homepage"}
                    title={isKo ? "홈페이지" : "Homepage"}
                  >
                    <Home size={16} />
                  </button>
                </div>
                <div className="mt-1 flex h-[168px] flex-col justify-between">
                  <p className="text-xs text-muted-foreground tracking-[0.18em] font-medium">
                    SYSTEM ERROR
                  </p>
                  <h1 className="text-3xl font-semibold text-foreground leading-tight">
                    {isKo ? "오류가 발생했습니다." : "An unexpected error occurred."}
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    {isKo ? "오류 코드" : "Error Code"}: {errorCode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
