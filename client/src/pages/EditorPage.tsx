/*
 * KEYP. EDITOR PAGE
 * Design: Sharp Editorial Intelligence
 * Layout: Full-width editor + Right AI panel (independent, non-invasive)
 * Features: Markdown editor, AI suggestions (manual apply only), bilingual fields
 */
import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { categories, currentSeason } from "@/lib/mockData";
import {
  ChevronLeft, Sparkles, X, Send, Check, Eye, EyeOff, Save, Globe
} from "lucide-react";
import { toast } from "sonner";
import Editor from "@/components/editor/Editor";

interface AISuggestion {
  id: string;
  type: 'improve' | 'translate' | 'expand' | 'summarize';
  original: string;
  suggestion: string;
  applied: boolean;
}

const AI_SUGGESTIONS_KO: AISuggestion[] = [
  {
    id: 'ai1',
    type: 'improve',
    original: '현재 단락',
    suggestion: '서론을 더 명확하게 구성하고, 독자의 관심을 끌 수 있는 핵심 질문으로 시작하는 것을 권장합니다. 예: "왜 이 주제가 지금 중요한가?"로 시작해보세요.',
    applied: false,
  },
  {
    id: 'ai2',
    type: 'expand',
    original: '본론 섹션',
    suggestion: '각 주장에 대한 구체적인 데이터나 사례를 추가하면 글의 신뢰도가 높아집니다. 관련 연구나 통계를 인용하는 것을 고려해보세요.',
    applied: false,
  },
  {
    id: 'ai3',
    type: 'translate',
    original: '전체 글',
    suggestion: 'Your article has been analyzed. The English translation maintains the academic tone while making it accessible to international readers. Key Korean cultural concepts have been explained in context.',
    applied: false,
  },
];

export default function EditorPage() {
  const { lang, setLang } = useLanguage();
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [tags, setTags] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>(AI_SUGGESTIONS_KO);
  const [plainText, setPlainText] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    {
      role: 'ai',
      text: '안녕하세요! 글쓰기를 도와드릴게요. 아래에 AI 제안이 표시됩니다. Apply 버튼을 눌러야만 내용이 반영됩니다.',
    },
  ]);
  const applySuggestion = (id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, applied: true } : s));
    toast('AI 제안이 적용되었습니다');
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    setTimeout(() => {
      setAiMessages(prev => [...prev, {
        role: 'ai',
        text: '분석 중입니다. 글의 구조와 내용을 검토하여 개선 제안을 아래에 추가했습니다. Apply 버튼으로만 적용됩니다.',
      }]);
      setSuggestions(prev => [...prev, {
        id: `ai${Date.now()}`,
        type: 'improve',
        original: userMsg,
        suggestion: `"${userMsg}"에 대한 AI 제안: 이 부분을 더 명확하게 표현하기 위해 구체적인 예시나 데이터를 추가하는 것을 권장합니다.`,
        applied: false,
      }]);
    }, 1000);
  };

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const charCount = plainText.length;

  return (
    <div className="flex min-h-screen">
      {/* ─── EDITOR MAIN ─── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Editor header */}
        <div className="sticky top-14 z-30 bg-background border-b border-border flex items-center gap-3 px-6 py-3">
          <Link href="/feed">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={16} />
              {lang === 'ko' ? '취소' : 'Cancel'}
            </button>
          </Link>

          <div className="flex-1" />

          {/* Season badge */}
          <span className="keyp-season-badge">{currentSeason.label}</span>

          {/* Preview toggle */}
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs transition-colors ${
              showPreview ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            }`}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            {lang === 'ko' ? '미리보기' : 'Preview'}
          </button>

          {/* Save draft */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            onClick={() => toast(lang === 'ko' ? '임시저장 완료' : 'Draft saved')}
          >
            <Save size={13} />
            {lang === 'ko' ? '임시저장' : 'Save Draft'}
          </button>

          {/* Publish */}
          <button
            className="keyp-btn-primary flex items-center gap-1.5 text-xs px-4 py-1.5"
            onClick={() => {
              if (!title || !plainText.trim() || !category) {
                toast.error(lang === 'ko' ? '제목, 내용, 카테고리를 입력해주세요' : 'Please fill in title, content, and category');
                return;
              }
              toast.success(lang === 'ko' ? '게시글이 발행되었습니다!' : 'Post published!');
            }}
          >
            <Check size={13} />
            {lang === 'ko' ? '발행하기' : 'Publish'}
          </button>
        </div>

        {/* Editor body */}
        <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
          {/* Language tabs for bilingual fields */}
          <div className="flex items-center gap-3 mb-6">
            <div className="keyp-lang-toggle">
              <button className={lang === 'ko' ? 'active' : ''} onClick={() => setLang('ko')}>KO</button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe size={12} />
              <span className="font-mono">
                {lang === 'ko' ? '한국어로 작성 중' : 'Writing in English'}
              </span>
            </div>
          </div>

          {/* Title input */}
          <div className="mb-4">
            <input
              type="text"
              value={lang === 'ko' ? title : titleEn}
              onChange={(e) => lang === 'ko' ? setTitle(e.target.value) : setTitleEn(e.target.value)}
              placeholder={lang === 'ko' ? '제목을 입력하세요...' : 'Enter title...'}
              className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-2xl md:text-3xl font-black py-3 focus:outline-none transition-colors placeholder:text-muted-foreground/50"
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
              <option value="">{lang === 'ko' ? '카테고리 선택' : 'Select Category'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {lang === 'ko' ? cat.label : cat.labelEn}
                </option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="bg-muted border border-border px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
            >
              <option value="beginner">{lang === 'ko' ? '입문' : 'Beginner'}</option>
              <option value="intermediate">{lang === 'ko' ? '중급' : 'Intermediate'}</option>
              <option value="advanced">{lang === 'ko' ? '심화' : 'Advanced'}</option>
            </select>

            {/* Tags */}
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={lang === 'ko' ? '태그 (쉼표로 구분)' : 'Tags (comma separated)'}
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
              title={lang === 'ko' ? 'AI 보조 패널 열기/닫기' : 'Toggle AI Assistant'}
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
                __html: content || `<p class="text-muted-foreground">${lang === 'ko' ? '내용을 입력하면 미리보기가 표시됩니다.' : 'Preview will appear when you start writing.'}</p>`,
              }}
            />
          ) : (
            <Editor
              value={content}
              onChange={(html, text) => {
                setContent(html);
                setPlainText(text);
              }}
            />
          )}

          {/* Writing tips */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="keyp-section-label mb-3">WRITING GUIDE</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  title: lang === 'ko' ? '구조화된 글쓰기' : 'Structured Writing',
                  desc: lang === 'ko' ? '## 헤딩으로 섹션을 명확히 구분하세요' : 'Use ## headings to clearly divide sections'
                },
                {
                  title: lang === 'ko' ? '이중 언어 지원' : 'Bilingual Support',
                  desc: lang === 'ko' ? 'KO/EN 탭으로 두 언어 버전을 작성하세요' : 'Write both language versions with KO/EN tabs'
                },
                {
                  title: lang === 'ko' ? 'AI 어시스턴트' : 'AI Assistant',
                  desc: lang === 'ko' ? 'AI 제안은 Apply 버튼으로만 적용됩니다' : 'AI suggestions apply only via the Apply button'
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
        <div className="hidden lg:flex flex-col w-80 shrink-0 sticky top-14 h-[calc(100vh-56px)] border-l border-border bg-card animate-slide-in-right">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-primary" />
              <span className="text-sm font-semibold">
                {lang === 'ko' ? 'AI 글쓰기 보조' : 'AI Write Assistant'}
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
              ⚠ {lang === 'ko'
                ? 'AI 제안은 자동 반영되지 않습니다. Apply 버튼으로만 적용됩니다.'
                : 'AI suggestions are NOT auto-applied. Use Apply button only.'}
            </p>
          </div>

          {/* Suggestions */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="keyp-section-label">AI SUGGESTIONS</p>

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
                placeholder={lang === 'ko' ? 'AI에게 요청하세요...' : 'Ask AI...'}
                className="flex-1 bg-muted border border-border px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
              />
              <button
                className="keyp-btn-primary px-3 py-2"
                onClick={handleAiSend}
                disabled={!aiInput.trim()}
              >
                <Send size={13} />
              </button>
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-1.5">
              Ollama Local · OpenAI Fallback
            </p>
          </div>
        </div>
      )}
    </div>
  );

}
