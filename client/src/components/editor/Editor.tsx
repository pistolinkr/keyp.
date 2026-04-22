import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import type { LucideIcon } from "lucide-react";
import {
  Bold,
  CheckSquare,
  Code,
  FileCode2,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Strikethrough,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, forwardRef, Fragment, type Ref } from "react";
import { createPortal } from "react-dom";

type EditorProps = {
  value: string;
  onChange: (html: string, text: string) => void;
};

export type EditorHandle = {
  applySuggestion: (text: string) => boolean;
  focus: () => void;
};

type SlashItem = {
  id: string;
  group: string;
  title: string;
  description: string;
  searchTerms: string[];
  /** Receives chain after deleteRange(range); must call .run() */
  command: (chain: any) => void;
  icon: LucideIcon;
};

type SlashMenuProps = {
  items: SlashItem[];
  command: (item: SlashItem) => void;
};

type SlashMenuRef = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

const AUTO_LINK_DOMAIN_SUFFIXES = [".com", ".net", ".xyz", ".go.kr", ".us", ".dev"] as const;

function shouldAutoLinkByRule(url: string) {
  const normalized = url.trim().toLowerCase();

  if (normalized.startsWith("https://")) {
    return true;
  }

  try {
    const withProtocol = normalized.includes("://") ? normalized : `http://${normalized}`;
    const parsed = new URL(withProtocol);
    return AUTO_LINK_DOMAIN_SUFFIXES.some((suffix) => parsed.hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl || !items.length) return;
    const selectedEl = listEl.querySelector<HTMLButtonElement>('[data-selected="true"]');
    selectedEl?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ key }) => {
      const n = items.length;
      if (n === 0) return false;

      if (key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + n - 1) % n);
        return true;
      }

      if (key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % n);
        return true;
      }

      if (key === "Home") {
        setSelectedIndex(0);
        return true;
      }

      if (key === "End") {
        setSelectedIndex(n - 1);
        return true;
      }

      if (key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    <div
      className="keyp-slash-menu flex max-h-[min(16.5rem,45vh)] w-[min(17.5rem,calc(100vw-1.25rem))] flex-col overflow-hidden rounded-md border border-border bg-popover text-popover-foreground text-[13px] shadow-md"
      role="region"
      aria-label="슬래시 명령"
    >
      {!items.length ? (
        <div className="px-2 py-5 text-center text-xs text-muted-foreground">일치하는 명령이 없습니다</div>
      ) : (
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-0.5" role="listbox" aria-label="선택 가능한 명령">
          {items.map((item, index) => {
            const Icon = item.icon;
            const showGroup = index === 0 || items[index - 1]!.group !== item.group;
            return (
              <Fragment key={item.id}>
                {showGroup && (
                  <div
                    className={`px-2 pb-0.5 pt-1.5 text-[10px] font-semibold text-muted-foreground ${
                      index > 0 ? "mt-0.5 border-t border-border" : ""
                    }`}
                    role="presentation"
                  >
                    {item.group}
                  </div>
                )}
                <button
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === selectedIndex}
                  className={`flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1.5 text-left outline-none transition-colors ${
                    index === selectedIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted/50"
                  }`}
                  data-selected={index === selectedIndex ? "true" : "false"}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectItem(index)}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-muted/50">
                    <Icon size={14} className="text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">{item.title}</p>
                    <p className="truncate text-[11px] leading-tight text-muted-foreground">{item.description}</p>
                  </div>
                </button>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
});

SlashMenu.displayName = "SlashMenu";

const slashItems: SlashItem[] = [
  {
    id: "bold",
    group: "선택 영역 서식",
    title: "굵게",
    description: "선택한 텍스트를 굵게 표시",
    searchTerms: ["bold", "b", "strong", "굵게"],
    icon: Bold,
    command: (chain) => chain.toggleBold().run(),
  },
  {
    id: "italic",
    group: "선택 영역 서식",
    title: "기울임",
    description: "선택한 텍스트를 기울임",
    searchTerms: ["italic", "i", "em", "기울임"],
    icon: Italic,
    command: (chain) => chain.toggleItalic().run(),
  },
  {
    id: "underline",
    group: "선택 영역 서식",
    title: "밑줄",
    description: "선택한 텍스트에 밑줄",
    searchTerms: ["underline", "u", "밑줄"],
    icon: Type,
    command: (chain) => chain.toggleUnderline().run(),
  },
  {
    id: "strike",
    group: "선택 영역 서식",
    title: "취소선",
    description: "선택한 텍스트에 취소선",
    searchTerms: ["strike", "strikethrough", "del", "취소선"],
    icon: Strikethrough,
    command: (chain) => chain.toggleStrike().run(),
  },
  {
    id: "code",
    group: "선택 영역 서식",
    title: "인라인 코드",
    description: "짧은 코드·명령어 강조",
    searchTerms: ["code", "inline", "코드", "인라인"],
    icon: Code,
    command: (chain) => chain.toggleCode().run(),
  },
  {
    id: "paragraph",
    group: "기본 블록",
    title: "본문",
    description: "일반 텍스트 단락",
    searchTerms: ["paragraph", "text", "본문", "텍스트", "p", "단락"],
    icon: Pilcrow,
    command: (chain) => chain.setParagraph().run(),
  },
  {
    id: "h1",
    group: "기본 블록",
    title: "제목 1",
    description: "큰 제목",
    searchTerms: ["h1", "heading", "heading1", "제목", "제목1", "#"],
    icon: Heading1,
    command: (chain) => chain.toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    group: "기본 블록",
    title: "제목 2",
    description: "중간 제목",
    searchTerms: ["h2", "heading2", "제목2", "##"],
    icon: Heading2,
    command: (chain) => chain.toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    group: "기본 블록",
    title: "제목 3",
    description: "작은 제목",
    searchTerms: ["h3", "heading3", "제목3", "###"],
    icon: Heading3,
    command: (chain) => chain.toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bullet",
    group: "목록",
    title: "글머리 기호 목록",
    description: "불릿 리스트",
    searchTerms: ["bullet", "ul", "list", "불릿", "글머리", "리스트"],
    icon: List,
    command: (chain) => chain.toggleBulletList().run(),
  },
  {
    id: "ordered",
    group: "목록",
    title: "번호 매기기",
    description: "순서 있는 목록",
    searchTerms: ["ordered", "ol", "number", "번호", "순서"],
    icon: ListOrdered,
    command: (chain) => chain.toggleOrderedList().run(),
  },
  {
    id: "task",
    group: "목록",
    title: "체크리스트",
    description: "할 일 · 체크 박스",
    searchTerms: ["task", "todo", "check", "체크", "할일"],
    icon: CheckSquare,
    command: (chain) => chain.toggleTaskList().run(),
  },
  {
    id: "quote",
    group: "삽입",
    title: "인용",
    description: "인용문 블록",
    searchTerms: ["quote", "blockquote", "인용", "인용문"],
    icon: Quote,
    command: (chain) => chain.toggleBlockquote().run(),
  },
  {
    id: "divider",
    group: "삽입",
    title: "구분선",
    description: "가로 구분선",
    searchTerms: ["divider", "hr", "line", "구분", "구분선", "---"],
    icon: Minus,
    command: (chain) => chain.setHorizontalRule().run(),
  },
  {
    id: "codeblock",
    group: "삽입",
    title: "코드 블록",
    description: "여러 줄 코드",
    searchTerms: ["code", "codeblock", "pre", "코드", "코드블록"],
    icon: FileCode2,
    command: (chain) => chain.toggleCodeBlock().run(),
  },
  {
    id: "link",
    group: "삽입",
    title: "링크",
    description: "URL이 있는 링크 삽입",
    searchTerms: ["link", "url", "href", "링크"],
    icon: Link2,
    command: (chain) => {
      const url = window.prompt("링크 URL을 입력하세요");
      if (!url?.trim()) {
        chain.run();
        return;
      }
      const href = url.trim();
      chain
        .insertContent({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: href,
              marks: [
                {
                  type: "link",
                  attrs: { href, target: "_blank", rel: "noopener noreferrer" },
                },
              ],
            },
          ],
        })
        .run();
    },
  },
  {
    id: "image",
    group: "삽입",
    title: "이미지",
    description: "이미지 URL 삽입",
    searchTerms: ["image", "img", "picture", "이미지", "사진"],
    icon: ImageIcon,
    command: (chain) => {
      const src = window.prompt("이미지 URL을 입력하세요");
      if (!src?.trim()) {
        chain.run();
        return;
      }
      chain.setImage({ src: src.trim() }).run();
    },
  },
];

function filterSlashItems(query: string): SlashItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return slashItems;
  return slashItems.filter((item) => {
    const blob = `${item.title} ${item.description} ${item.searchTerms.join(" ")} ${item.group}`.toLowerCase();
    return blob.includes(q);
  });
}

/** 현재 블록에서 커서 직전까지의 문자열로 `/` 명령 구간 파싱 (줄 시작 또는 공백 뒤 `/`, 검색어는 공백 없음) */
function detectSlashAtCursor(editor: TiptapEditor): { from: number; to: number; query: string } | null {
  const { state } = editor;
  const { selection } = state;
  if (!selection.empty) return null;
  const $from = selection.$from;
  if (!$from.parent.type.isTextblock) return null;
  const blockStart = $from.start();
  const end = $from.pos;
  const text = state.doc.textBetween(blockStart, end, "\0", "\0");
  const m = text.match(/(?:^|\s)(\/[^\s]*)$/);
  if (!m) return null;
  const token = m[1];
  if (!token || token[0] !== "/") return null;
  const from = blockStart + text.length - token.length;
  const to = end;
  if (from > to || from < blockStart) return null;
  return { from, to, query: token.slice(1) };
}

function Editor({ value, onChange }: EditorProps, ref: Ref<EditorHandle>) {
  const [dragHandleTargetType, setDragHandleTargetType] = useState<string | null>(null);
  const dragHandleTargetTypeRef = useRef<string | null>(null);
  const [slashPalette, setSlashPalette] = useState<{ from: number; to: number; query: string } | null>(null);
  const slashPaletteRef = useRef(slashPalette);
  slashPaletteRef.current = slashPalette;
  const slashMenuRef = useRef<SlashMenuRef>(null);
  const editorRef = useRef<TiptapEditor | null>(null);
  const [paletteCoords, setPaletteCoords] = useState({ top: 0, left: 0 });

  const handleDragTargetChange = useCallback(({ node }: { node: { type?: { name?: string } } | null }) => {
    const nextType = node?.type?.name ?? null;
    if (dragHandleTargetTypeRef.current === nextType) return;
    dragHandleTargetTypeRef.current = nextType;
    setDragHandleTargetType(nextType);
  }, []);

  const dismissSlashPalette = useCallback((editor: TiptapEditor | null, removeTrigger: boolean) => {
    const st = slashPaletteRef.current;
    if (removeTrigger && editor && st) {
      editor.chain().focus().deleteRange({ from: st.from, to: st.to }).run();
    }
    setSlashPalette(null);
  }, []);

  /** 확장은 StarterKit 한 번만 — link/underline/dropcursor를 밖에서 또 넣지 않음 (중복 경고 방지). */
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          openOnClick: false,
          shouldAutoLink: shouldAutoLinkByRule,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-2",
          },
        },
        underline: {},
        dropcursor: {
          color: "#3b82f6",
          width: 2,
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full border border-border",
        },
      }),
      Placeholder.configure({
        placeholder: '빈 페이지입니다. "/" 를 눌러 블록·목록·삽입 명령을 여세요.',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    /** 부모 `key`로 리마운트할 때만 갱신 — 타이핑 중 `value` prop을 다시 넣지 않음(슬래시 메뉴 리셋 방지). */
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "ProseMirror keyp-tiptap min-h-[420px] rounded-md px-14 py-8 font-sans text-[16px] leading-7 text-foreground focus:outline-none [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0 [&_.is-empty::before]:text-muted-foreground/60 [&_.is-empty::before]:content-[attr(data-placeholder)]",
      },
      handleKeyDown: (_view, event) => {
        if (!slashPaletteRef.current) return false;
        if (event.key === "Escape") {
          event.preventDefault();
          dismissSlashPalette(editorRef.current, true);
          return true;
        }
        const handled = slashMenuRef.current?.onKeyDown(event) ?? false;
        if (handled) event.preventDefault();
        return handled;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML(), currentEditor.getText());
      if (!currentEditor.view.composing) {
        setSlashPalette(detectSlashAtCursor(currentEditor));
      }
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      if (!currentEditor.view.composing) {
        setSlashPalette(detectSlashAtCursor(currentEditor));
      }
    },
  });

  useEffect(() => {
    editorRef.current = editor ?? null;
  }, [editor]);

  const slashItemsFiltered = useMemo(
    () => (slashPalette ? filterSlashItems(slashPalette.query) : []),
    [slashPalette],
  );

  useLayoutEffect(() => {
    if (!editor || !slashPalette) return;
    try {
      const coords = editor.view.coordsAtPos(slashPalette.to);
      setPaletteCoords({ top: coords.bottom + 6, left: coords.left });
    } catch {
      setPaletteCoords({ top: 0, left: 0 });
    }
  }, [editor, slashPalette, slashPalette?.to, slashPalette?.query]);

  const runSlashCommand = useCallback(
    (item: SlashItem) => {
      if (!editor || !slashPaletteRef.current) return;
      const { from, to } = slashPaletteRef.current;
      item.command(editor.chain().focus().deleteRange({ from, to }));
      setSlashPalette(null);
    },
    [editor],
  );

  useImperativeHandle(
    ref,
    () => ({
      applySuggestion: (text: string) => {
        if (!editor) return false;
        const next = text.trim();
        if (!next) return false;

        const { from, to, empty, $from } = editor.state.selection;
        const chain = editor.chain().focus();

        if (!empty) {
          return chain.deleteRange({ from, to }).insertContent(next).run();
        }

        // Default behavior should feel like "replace":
        // when nothing is selected, replace current text block content.
        const blockFrom = $from.start();
        const blockTo = $from.end();
        if (blockTo > blockFrom) {
          return chain.deleteRange({ from: blockFrom, to: blockTo }).insertContentAt(blockFrom, next).run();
        }

        return chain.insertContent(next).run();
      },
      focus: () => {
        if (!editor) return;
        editor.chain().focus().run();
      },
    }),
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="relative rounded-lg border border-border/60 bg-background">
      <BubbleMenu editor={editor} className="flex items-center gap-1 rounded-md border border-border bg-card p-1 shadow-lg">
        <button
          type="button"
          className={`rounded p-1.5 ${editor.isActive("bold") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60"}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          className={`rounded p-1.5 ${editor.isActive("italic") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60"}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          className={`rounded p-1.5 ${editor.isActive("underline") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60"}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span
            className="text-[11px] font-bold leading-none underline decoration-2 underline-offset-2"
            aria-hidden
          >
            U
          </span>
        </button>
        <button
          type="button"
          className={`rounded p-1.5 ${editor.isActive("strike") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60"}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={14} />
        </button>
        <button
          type="button"
          className={`rounded p-1.5 ${editor.isActive("code") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60"}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={14} />
        </button>
      </BubbleMenu>

      <DragHandle
        editor={editor}
        computePositionConfig={{
          placement: "left-start",
        }}
        onNodeChange={handleDragTargetChange}
        className={`z-20 ${dragHandleTargetType === "horizontalRule" ? "keyp-drag-handle--hr" : ""}`}
      >
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground/70 transition hover:bg-accent hover:text-foreground"
          aria-label="블록 드래그 핸들"
        >
          <GripVertical size={14} />
        </button>
      </DragHandle>

      <EditorContent editor={editor} />

      {slashPalette &&
        editor &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed z-50" style={{ top: paletteCoords.top, left: paletteCoords.left }}>
            <SlashMenu ref={slashMenuRef} items={slashItemsFiltered} command={runSlashCommand} />
          </div>,
          document.body,
        )}
    </div>
  );
}

const ForwardedEditor = forwardRef<EditorHandle, EditorProps>(Editor);
ForwardedEditor.displayName = "Editor";

export default ForwardedEditor;
