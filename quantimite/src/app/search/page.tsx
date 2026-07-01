"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Hit {
  kind: "content" | "guide";
  id: string;
  title: string;
  type: string;
  path: string;
  breadcrumb: string;
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [source, setSource] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setHits([]);
        return;
      }
      setBusy(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setHits(j.hits);
        setSource(j.source);
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search subjects, chapters, guides..."
        className="w-full border border-slate-300 rounded px-3 py-2"
      />
      <p className="text-xs text-slate-500">
        {busy ? "Searching..." : `${hits.length} result(s)${source ? ` · source: ${source}` : ""}`}
      </p>
      <ul className="divide-y divide-slate-200 border border-slate-200 rounded">
        {hits.map((h) => (
          <li key={`${h.kind}:${h.id}`} className="p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{h.kind} · {h.type}</div>
            <Link href={h.path} className="block font-medium hover:text-brand-600">{h.title}</Link>
            <div className="text-xs text-slate-500 mt-1">{h.breadcrumb}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}