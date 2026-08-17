"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { MediaPicker } from "./MediaPicker";

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm transition-colors ${
        active
          ? "bg-brand/15 text-brand font-semibold"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      } disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px self-stretch bg-zinc-200 mx-0.5" />;
}

export function RichEditor({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [showMedia, setShowMedia] = useState(false);
  const [content, setContent] = useState(defaultValue ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-brand underline" } }),
      Placeholder.configure({ placeholder: placeholder ?? "Rédigez votre contenu…" }),
    ],
    content: defaultValue ?? "",
    onUpdate({ editor }) {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] px-4 py-3 text-sm text-zinc-800 focus:outline-none prose prose-sm max-w-none",
      },
    },
  });

  // Sync when defaultValue changes (edit page)
  useEffect(() => {
    if (editor && defaultValue && editor.isEmpty) {
      editor.commands.setContent(defaultValue);
      setContent(defaultValue);
    }
  }, [editor, defaultValue]);

  function insertImage(url: string) {
    editor?.chain().focus().setImage({ src: url }).run();
    setShowMedia(false);
  }

  function setLink() {
    const prev = editor?.getAttributes("link").href ?? "";
    const url = window.prompt("URL du lien", prev);
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().unsetLink().run();
    } else {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }

  if (!editor) return null;

  return (
    <>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={content} />

      <div className="rounded-md border border-zinc-300 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5">
          <ToolbarButton
            title="Gras"
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
          >
            <strong>G</strong>
          </ToolbarButton>
          <ToolbarButton
            title="Italique"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            title="Barré"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
          >
            <s>S</s>
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            title="Titre 2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            title="Titre 3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
          >
            H3
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            title="Liste à puces"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
          >
            • Liste
          </ToolbarButton>
          <ToolbarButton
            title="Liste numérotée"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
          >
            1. Liste
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            title="Citation"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
          >
            ❝
          </ToolbarButton>
          <ToolbarButton title="Lien" onClick={setLink} active={editor.isActive("link")}>
            🔗
          </ToolbarButton>

          <Divider />

          <ToolbarButton title="Image" onClick={() => setShowMedia(true)}>
            🖼
          </ToolbarButton>
        </div>

        {/* Editor area */}
        <div className="bg-white">
          <EditorContent editor={editor} />
        </div>
      </div>

      {showMedia && (
        <MediaPicker onSelect={insertImage} onClose={() => setShowMedia(false)} />
      )}
    </>
  );
}
