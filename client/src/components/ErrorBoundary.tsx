import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-foreground flex items-center justify-center">
                <span className="text-background font-black text-sm" style={{ fontFamily: 'Noto Sans KR' }}>K</span>
              </div>
              <span className="font-black text-lg" style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}>Keyp.</span>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-md w-full">
              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 border border-destructive flex items-center justify-center flex-shrink-0 mt-1">
                  <AlertTriangle size={22} strokeWidth={1.5} className="text-destructive" />
                </div>
                <div>
                  <p className="font-mono text-xs text-muted-foreground tracking-widest mb-2">SYSTEM ERROR</p>
                  <h1 className="text-3xl font-black text-foreground leading-tight mb-3" style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.03em' }}>
                    오류가 발생했습니다
                  </h1>
                  <p className="text-sm text-muted-foreground">An unexpected error occurred.</p>
                </div>
              </div>
              <div className="bg-muted border border-border p-4 mb-6 overflow-auto max-h-48">
                <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                  {this.state.error?.stack}
                </pre>
              </div>
              <div className="h-px bg-border mb-6" />
              <button
                onClick={() => window.location.reload()}
                className="keyp-btn-primary flex items-center gap-2"
              >
                <RotateCcw size={14} />
                페이지 새로고침 / Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
