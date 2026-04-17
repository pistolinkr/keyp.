import { EditorContent, ReactRenderer, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Extension } from "@tiptap/core";
import Dropcursor from "@tiptap/extension-dropcursor";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Suggestion from "@tiptap/suggestion";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import tippy, { type Instance } from "tippy.js";
import { Bold, CheckSquare, Code, GripVertical, Heading1, Heading2, Heading3, Italic, List, Pilcrow, Strikethrough } from "lucide-react";
import { useEffect, useImperativeHandle, useMemo, useState, forwardRef } from "react";
import "tippy.js/dist/tippy.css";

type EditorProps = {
  value: string;
  onChange: (html: string, text: string) => void;
};

type SlashItem = {
  title: string;
  description: string;
  searchTerms: string[];
  command: (editor: any) => void;
  icon: typeof Pilcrow;
};

type SlashMenuProps = {
  items: SlashItem[];
  command: (item: SlashItem) => void;
};

type SlashMenuRef = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ key }) => {
      if (key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }

      if (key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }

      if (key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-lg">
        No results
      </div>
    );
  }

  return (
    <div className="w-72 rounded-md border border-border bg-card p-1 shadow-lg">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type="button"
            className={`flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors ${
              index === selectedIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/60"
            }`}
            onClick={() => selectItem(index)}
          >
            <Icon size={15} className="text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate font-medium">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
});

SlashMenu.displayName = "SlashMenu";

const slashItems: SlashItem[] = [
  {
    title: "텍스트 (Paragraph)",
    description: "일반 본문으로 전환",
    searchTerms: ["paragraph", "text", "본문", "텍스트"],
    icon: Pilcrow,
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: "제목 1 (H1)",
    description: "큰 제목",
    searchTerms: ["h1", "heading1", "제목1"],
    icon: Heading1,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "제목 2 (H2)",
    description: "중간 제목",
    searchTerms: ["h2", "heading2", "제목2"],
    icon: Heading2,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "제목 3 (H3)",
    description: "작은 제목",
    searchTerms: ["h3", "heading3", "제목3"],
    icon: Heading3,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "불릿 리스트 (Bullet List)",
    description: "점 목록 만들기",
    searchTerms: ["bullet", "list", "ul", "불릿", "리스트"],
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "체크리스트 (Task List)",
    description: "체크 가능한 목록",
    searchTerms: ["task", "todo", "check", "체크", "할일"],
    icon: CheckSquare,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
];

const renderSlashMenu = () => {
  let component: ReactRenderer<SlashMenuRef, SlashMenuProps>;
  let popup: Instance[];

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(SlashMenu, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },

    onUpdate(props: any) {
      component.updateProps(props);

      if (!props.clientRect || !popup[0]) {
        return;
      }

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === "Escape") {
        popup[0]?.hide();
        return true;
      }

      return component.ref?.onKeyDown(props.event) ?? false;
    },

    onExit() {
      popup[0]?.destroy();
      component.destroy();
    },
  };
};

const SlashCommand = Extension.create({
  name: "slash-command",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command(editor.chain().focus().deleteRange(range));
        },
        items: ({ query }: { query: string }) =>
          slashItems.filter((item) => {
            const search = `${item.title} ${item.description} ${item.searchTerms.join(" ")}`.toLowerCase();
            return search.includes(query.toLowerCase());
          }),
        render: renderSlashMenu,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default function Editor({ value, onChange }: EditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "빈 페이지입니다. '/'를 눌러 명령어를 확인하세요.",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Dropcursor.configure({
        color: "#3b82f6",
        width: 2,
      }),
      SlashCommand,
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "ProseMirror min-h-[420px] rounded-md px-14 py-8 font-sans text-[16px] leading-7 text-foreground focus:outline-none [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0 [&_.is-empty::before]:text-muted-foreground/60 [&_.is-empty::before]:content-[attr(data-placeholder)]",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML(), currentEditor.getText());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

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
        className="z-20"
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
    </div>
  );
}
