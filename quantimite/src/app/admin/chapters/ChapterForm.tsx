"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChapterForm({ subjects }: { subjects: { id: string; label: string }[] }) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/content/chapters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId, title, slug, order, isPublished }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j.error || "Failed");
        return;
      }
      setTitle(""); setSlug(""); setOrder(0); setIsPublished(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border border-slate-200 rounded p-4">
      <div>
        <label className="block text-sm font-medium">Subject</label>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5">
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
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
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Publish
      </label>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button disabled={busy} className="w-full bg-brand-600 text-white py-2 rounded disabled:opacity-50">
        {busy ? "Saving..." : "Create chapter"}
      </button>
    </form>
  );
}