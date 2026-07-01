import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [subjects, chapters, items, users] = await Promise.all([
    prisma.subject.count({ where: { deletedAt: null } }),
    prisma.chapter.count({ where: { deletedAt: null } }),
    prisma.contentItem.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
  ]);

  return (
    <div className="space-y-6">
      <p className="text-slate-600">Quick stats. Use the sections below to manage content.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Subjects" value={subjects} />
        <Stat label="Chapters" value={chapters} />
        <Stat label="Content items" value={items} />
        <Stat label="Users" value={users} />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <a className="block border border-slate-200 rounded p-4 hover:border-brand-500" href="/admin/subjects">
          Manage subjects
        </a>
        <a className="block border border-slate-200 rounded p-4 hover:border-brand-500" href="/admin/chapters">
          Manage chapters
        </a>
        <a className="block border border-slate-200 rounded p-4 hover:border-brand-500" href="/admin/content">
          Manage content items
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 rounded p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}