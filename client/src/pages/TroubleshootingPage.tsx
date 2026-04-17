import { ArrowLeft, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

type ErrorCodeItem = {
  code: string;
  titleKo: string;
  titleEn: string;
  summaryKo: string;
  summaryEn: string;
  userActionKo: string;
  userActionEn: string;
};

const ERROR_CODE_GUIDE: ErrorCodeItem[] = [
  {
    code: "STUCK-MAN-0001",
    titleKo: "예기치 않은 런타임 오류",
    titleEn: "Unexpected Runtime Error",
    summaryKo: "애플리케이션 실행 중 예기치 않은 오류가 감지되었습니다.",
    summaryEn: "An unexpected runtime error occurred while the application was running.",
    userActionKo: "페이지를 새로고침한 뒤 같은 문제가 반복되면 홈으로 이동 후 다시 시도하세요.",
    userActionEn: "Reload the page. If the issue repeats, return to Home and try again.",
  },
  {
    code: "STUCK-MAN-0002",
    titleKo: "일시적 이용 불가",
    titleEn: "Temporarily Unavailable",
    summaryKo: "서비스 일부 기능이 일시적으로 응답하지 않을 수 있습니다.",
    summaryEn: "Some features may be temporarily unavailable.",
    userActionKo: "잠시 후 재시도해 주세요. 문제가 지속되면 관리자에게 코드와 함께 제보해 주세요.",
    userActionEn: "Please try again shortly. If it persists, report it with the code.",
  },
  {
    code: "STUCK-MAN-0003",
    titleKo: "세션 상태 오류",
    titleEn: "Session Issue",
    summaryKo: "현재 세션 상태를 확인할 수 없습니다.",
    summaryEn: "The current session state could not be validated.",
    userActionKo: "홈으로 이동 후 다시 로그인하거나 새로고침해 세션을 재설정하세요.",
    userActionEn: "Go to Home and sign in again, or reload to reset your session.",
  },
];

export default function TroubleshootingPage() {
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const isKo = lang === "ko";
  const codeFromQuery = new URLSearchParams(window.location.search).get("code") ?? "";
  const feedbackMailBody = isKo
    ? `안녕하세요,\n\n아래와 같이 오류 제보를 보냅니다.\n\n- Error Code: ${codeFromQuery || "STUCK-MAN-0001"}\n- 발생 페이지(URL): \n- 발생 시각: \n- 재현 절차: \n1) \n2) \n3) \n- 기대 동작: \n- 실제 동작: \n- 추가 메모: \n`
    : `Hello,\n\nI am sending an error report with details below.\n\n- Error Code: ${codeFromQuery || "STUCK-MAN-0001"}\n- Page URL: \n- Time observed: \n- Steps to reproduce: \n1) \n2) \n3) \n- Expected behavior: \n- Actual behavior: \n- Additional notes: \n`;
  const feedbackMailHref = `mailto:pistolinkr@icloud.com?subject=${encodeURIComponent(
    `[Keyp Error] ${codeFromQuery || "STUCK-MAN-0001"}`,
  )}&body=${encodeURIComponent(feedbackMailBody)}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-14 border-b border-border flex items-center justify-between px-6">
        <Link href="/">
          <img src="/logo.png" alt="Keyp. logo" className="h-7 w-auto object-contain cursor-pointer" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
            <button
              type="button"
              onClick={() => setLang("ko")}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                isKo ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              KO
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                isKo ? "text-muted-foreground hover:bg-accent" : "bg-foreground text-background"
              }`}
            >
              EN
            </button>
          </div>
          <Link href="/">
            <button className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <ArrowLeft size={14} />
              {isKo ? "홈" : "Home"}
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-8">
            <p className="text-xs tracking-[0.18em] text-muted-foreground">GUIDE4-STUCK-MAN</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">
              {isKo ? "오류 코드 안내" : "Error Code Guide"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isKo
                ? "상세 내부 정보는 보안 정책에 따라 노출하지 않으며, 에러 코드를 기준으로 대응 방법을 안내합니다."
                : "Detailed internal errors are hidden for security. Use error codes to identify next actions."}
            </p>
          </div>

          {codeFromQuery ? (
            <div className="mb-6 rounded-md border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              {isKo ? "현재 확인 중인 코드" : "Current code"}: <span className="font-semibold">{codeFromQuery}</span>
            </div>
          ) : null}

          <div className="space-y-4">
            {ERROR_CODE_GUIDE.map((item) => (
              <section key={item.code} className="rounded-md border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">{item.code}</p>
                  <span className="text-xs text-muted-foreground">{isKo ? item.titleKo : item.titleEn}</span>
                </div>
                <p className="text-sm text-foreground">{isKo ? item.summaryKo : item.summaryEn}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isKo ? "조치" : "Action"}: {isKo ? item.userActionKo : item.userActionEn}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-md border border-border p-4">
            <p className="text-xs tracking-[0.16em] text-muted-foreground">SUPPORT</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {isKo
                ? "문의 시 에러 코드와 발생 시점(시간/페이지)을 함께 전달하면 빠르게 확인할 수 있습니다."
                : "When contacting support, include the error code and where/when it happened."}
            </p>
            <a
              href={feedbackMailHref}
              className="mt-3 inline-flex items-center gap-1 text-sm text-foreground underline-offset-4 hover:underline"
            >
              {isKo ? "메일 보내기" : "Send Email"}
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
