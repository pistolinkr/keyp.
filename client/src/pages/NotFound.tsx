import { Link } from "wouter";
import { ArrowLeft, FileX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-6">
        <Link href="/feed">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 bg-foreground flex items-center justify-center">
              <span className="text-background font-black text-sm" style={{ fontFamily: 'Noto Sans KR' }}>K</span>
            </div>
            <span className="font-black text-lg" style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}>Keyp.</span>
          </div>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 border border-border flex items-center justify-center flex-shrink-0 mt-1">
              <FileX size={22} strokeWidth={1.5} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground tracking-widest mb-2">ERROR · 404</p>
              <h1
                className="text-5xl font-black text-foreground leading-none mb-3"
                style={{ fontFamily: 'Noto Sans KR', letterSpacing: '-0.04em' }}
              >
                페이지를<br />찾을 수 없습니다
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Page not found.<br />
                요청하신 페이지가 존재하지 않거나 이동되었습니다.
              </p>
            </div>
          </div>

          <div className="h-px bg-border mb-8" />

          <div className="flex items-center gap-4">
            <Link href="/feed">
              <button className="keyp-btn-primary flex items-center gap-2">
                <ArrowLeft size={14} />
                피드로 돌아가기
              </button>
            </Link>
            <Link href="/">
              <button className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                홈으로 / Home
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />
      <div className="px-6 py-4">
        <p className="font-mono text-xs text-muted-foreground">Keyp. — Korean Knowledge Community</p>
      </div>
    </div>
  );
}
