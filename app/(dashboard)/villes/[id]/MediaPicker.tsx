"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type MediaFile = { name: string; url: string };

const BUCKET = "media";

export function MediaPicker({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    const withUrls = (data ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => ({
        name: f.name,
        url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
      }));
    setFiles(withUrls);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    });
    if (upErr) { setError(upErr.message); setUploading(false); return; }
    await load();
    const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    setUploading(false);
    onSelect(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] bg-white rounded-xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Bibliothèque d&apos;images</h2>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={upload}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-primary text-xs"
            >
              {uploading ? "Envoi…" : "+ Téléverser"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 text-lg leading-none px-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          {loading ? (
            <p className="text-sm text-zinc-400 text-center py-10">Chargement…</p>
          ) : files.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-zinc-400 mb-3">Aucune image pour l&apos;instant.</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn-primary"
              >
                Téléverser une image
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {files.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => onSelect(f.url)}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-brand focus:outline-none focus:border-brand"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt={f.name}
                    className="h-full w-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
