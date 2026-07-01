"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface ET { id: string; slug: string; name: string; }
interface Dept { id: string; name: string; educationTypeId: string; }

export default function SubjectForm({
  educationTypes,
  departments,
}: {
  educationTypes: ET[];
  departments: Dept[];
}) {
  const router = useRouter();
  const [etSlug, setEtSlug] = useState<string>("school");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [classLevel, setClassLevel] = useState<string>("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const etId = useMemo(() => educationTypes.find((e) => e.slug === etSlug)?.id, [etSlug, educationTypes]);
  const filteredDepts = useMemo(() => departments.filter((d) => d.educationTypeId === etId), [departments, etId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/content/subjects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          educationTypeSlug: etSlug,
          departmentId:
            etSlug === "university"
              ? departmentId || null
              : (filteredDepts[0]?.id ?? null), // auto-pick the "General" sentinel for school/abroad
          classLevel: etSlug === "school" || etSlug === "university" ? (classLevel ? Number(classLevel) : null) : null,
          name,
          slug,
          description: description || undefined,
          isPublished,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j.error || "Failed");
        return;
      }
      setName(""); setSlug(""); setDescription(""); setClassLevel(""); setDepartmentId("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border border-slate-200 rounded p-4">
      <div>
        <label className="block text-sm font-medium">Type</label>
        <select value={etSlug} onChange={(e) => setEtSlug(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5">
          {educationTypes.map((e) => <option key={e.slug} value={e.slug}>{e.name}</option>)}
        </select>
      </div>

      {etSlug === "university" && (
        <div>
          <label className="block text-sm font-medium">Department</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5">
            <option value="">— select —</option>
            {filteredDepts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}

      {(etSlug === "school" || etSlug === "university") && (
        <div>
          <label className="block text-sm font-medium">
            {etSlug === "school" ? "Class level (0-12)" : "Year (1-5)"}
          </label>
          <input
            type="number"
            min={etSlug === "school" ? 0 : 1}
            max={etSlug === "school" ? 12 : 5}
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            className="w-full border border-slate-300 rounded px-2 py-1.5"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-slate-300 rounded px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-sm font-medium">Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" className="w-full border border-slate-300 rounded px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5" rows={2} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Publish
      </label>

      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button disabled={busy} className="w-full bg-brand-600 text-white py-2 rounded disabled:opacity-50">
        {busy ? "Saving..." : "Create subject"}
      </button>
    </form>
  );
}