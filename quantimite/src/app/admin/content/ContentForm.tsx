"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ContentTypeVal = "video" | "pdf" | "article" | "quiz" | "guideline";

export default function ContentForm({ chapters }: { chapters: { id: string; label: string }[] }) {
  const router = useRouter();
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? "");
  const [type, setType] = useState<ContentTypeVal>("article");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [youtubeId, setYoutubeId] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      let fileKey: string | undefined;
      let mimeType: string | undefined;
      let fileBytes: number | undefined;
      if (type === "pdf" && file) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("kind", "pdf");
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) {
          const j = await up.json().catch(() => ({}));
          setErr(j.error || "Upload failed");
          return;
        }
        const upRes = await up.json();
        fileKey = upRes.key;
        mimeType = file.type || "application/pdf";
        fileBytes = file.size;
      }

      const r = await fetch("/api/content/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chapterId,
          type,
          title,
          slug,
          order,
          isPublished,
          youtubeId: type === "video" ? youtubeId || undefined : undefined,
          fileKey,
          mimeType,
          fileBytes,
          bodyHtml: type === "article" || type === "guideline" ? bodyHtml || undefined : undefined,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j.error || "Failed");
        return;
      }
      setTitle(""); setSlug(""); setBodyHtml(""); setYoutubeId(""); setFile(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border border-slate-200 rounded p-4">
      <div>
        <label className="block text-sm font-medium">Chapter</label>
        <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5">
          {chapters.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as ContentTypeVal)} className="w-full border border-slate-300 rounded px-2 py-1.5">
          <option value="article">Article</option>
          <option value="video">Video (YouTube)</option>
          <option value="pdf">PDF</option>
          <option value="guideline">Guideline</option>
          <option value="quiz">Quiz</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border border-slate-300 rounded px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-sm font-medium">Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" className="w-full border border-slate-300 rounded px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-sm font-medium">Order</label>
        <input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full border border-slate-300 rounded px-2 py-1.5" />
      </div>

      {type === "video" && (
        <div>
          <label className="block text-sm font-medium">YouTube ID</label>
          <input value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} placeholder="dQw4w9WgXcQ" className="w-full border border-slate-300 rounded px-2 py-1.5" />
          <p className="text-xs text-slate-500 mt-1">The part after <code>v=</code> in the URL.</p>
        </div>
      )}

      {type === "pdf" && (
        <div>
          <label className="block text-sm font-medium">PDF file (max 50MB)</label>
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      )}

      {(type === "article" || type === "guideline") && (
        <div>
          <label className="block text-sm font-medium">Body HTML (sanitized on save)</label>
          <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 font-mono text-xs" rows={8} />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Publish
      </label>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button disabled={busy} className="w-full bg-brand-600 text-white py-2 rounded disabled:opacity-50">
        {busy ? "Saving..." : "Create content"}
      </button>
    </form>
  );
}