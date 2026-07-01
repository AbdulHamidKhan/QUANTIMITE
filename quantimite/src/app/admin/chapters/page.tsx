import { prisma } from "@/lib/db";
import ChapterForm from "./ChapterForm";

export const dynamic = "force-dynamic";

export default async function AdminChapters() {
  const [subjects, chapters] = await Promise.all([
    prisma.subject.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, classLevel: true, educationType: { select: { slug: true } } },
    }),
    prisma.chapter.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { subject: { select: { name: true } }, _count: { select: { items: true } } },
    }),
  ]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <section className="md:col-span-2">
        <h2 className="text-lg font-semibold mb-3">Recent chapters</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2">Title</th>
              <th>Subject</th>
              <th>Items</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((c) => (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="py-2">{c.title} <span className="text-xs text-slate-500">/{c.slug}</span></td>
                <td>{c.subject.name}</td>
                <td>{c._count.items}</td>
                <td>{c.isPublished ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Create chapter</h2>
        <ChapterForm subjects={subjects.map((s) => ({ id: s.id, label: `${s.educationType.slug} • ${s.name}${s.classLevel != null ? ` (${s.classLevel})` : ""}` }))} />
      </section>
    </div>
  );
}