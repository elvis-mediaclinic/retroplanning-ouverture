"use client";

import React, { useEffect, useState } from "react";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { BlockNoteView as _BlockNoteView } from "@blocknote/mantine";
import { BlockNoteSchema } from "@blocknote/core";
import { withMultiColumn, insertColumnList } from "@blocknote/xl-multi-column";
import "@blocknote/mantine/style.css";
import { MediaPicker } from "./MediaPicker";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BlockNoteView = _BlockNoteView as React.ComponentType<any>;

const schema = withMultiColumn(BlockNoteSchema.create());

// Items de colonnes définis manuellement (évite le besoin du dictionnaire multi-column)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getColumnItems(editor: any) {
  return [
    {
      title: "2 colonnes",
      subtext: "Deux colonnes côte à côte",
      aliases: ["colonnes", "colonne", "ligne", "2col"],
      group: "Mise en page",
      icon: <span className="text-sm">⊞</span>,
      onItemClick: () => insertColumnList(editor, 2),
    },
    {
      title: "3 colonnes",
      subtext: "Trois colonnes côte à côte",
      aliases: ["colonnes", "colonne", "ligne", "3col"],
      group: "Mise en page",
      icon: <span className="text-sm">⊟</span>,
      onItemClick: () => insertColumnList(editor, 3),
    },
  ];
}

export function BlockEditor({
  defaultJson,
  onJsonChange,
  hiddenInputName,
}: {
  defaultJson?: string | null;
  onJsonChange?: (json: string) => void;
  hiddenInputName?: string;
}) {
  const [showMedia, setShowMedia] = useState(false);
  const [json, setJson] = useState(defaultJson ?? "");

  const initialContent = (() => {
    try { return defaultJson ? JSON.parse(defaultJson) : undefined; } catch { return undefined; }
  })();

  const editor = useCreateBlockNote({
    schema,
    initialContent,
    uploadFile: async () =>
      new Promise<string>((resolve) => {
        setShowMedia(true);
        (window as unknown as { __bnResolve?: (u: string) => void }).__bnResolve = resolve;
      }),
  });

  function handleMediaSelect(url: string) {
    setShowMedia(false);
    const resolve = (window as unknown as { __bnResolve?: (u: string) => void }).__bnResolve;
    if (resolve) {
      resolve(url);
      (window as unknown as { __bnResolve?: (u: string) => void }).__bnResolve = undefined;
    } else {
      editor.insertBlocks(
        [{ type: "image", props: { url, caption: "", showPreview: true, previewWidth: 512 } }],
        editor.getTextCursorPosition().block,
        "after"
      );
    }
  }

  function handleChange() {
    const j = JSON.stringify(editor.document);
    setJson(j);
    onJsonChange?.(j);
  }

  useEffect(() => { handleChange(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {hiddenInputName && <input type="hidden" name={hiddenInputName} value={json} />}

      <div className="mb-1">
        <button
          type="button"
          onClick={() => setShowMedia(true)}
          className="rounded border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
        >
          🖼 Insérer une image
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 overflow-hidden bg-white min-h-[200px]">
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          theme="light"
          slashMenu={false}
        >
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query: string) => [
              ...getDefaultReactSlashMenuItems(editor),
              ...getColumnItems(editor),
            ].filter((i) => {
              const q = query.toLowerCase();
              return (
                i.title.toLowerCase().includes(q) ||
                (i.aliases ?? []).some((a: string) => a.toLowerCase().includes(q))
              );
            })}
          />
        </BlockNoteView>
      </div>

      {showMedia && (
        <MediaPicker onSelect={handleMediaSelect} onClose={() => setShowMedia(false)} />
      )}
    </>
  );
}
