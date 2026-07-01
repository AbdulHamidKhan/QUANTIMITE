import { prisma } from "@/lib/db";
import ContentForm from "./ContentForm";

export const dynamic = "force-dynamic";

export default async function AdminContent() {
  const [chapters, items] = await Promise.all([
    prisma.chapter.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" },
      select: { id: true, title: true, subject: { select: { name: true, classLevel: true } } },
    }),
    prisma.contentItem.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { chapter: { select: { title: true } } },
    }),
  ]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <section className="md:col-span-2">
        <h2 className="text-lg font-semibold mb-3">Recent content items</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2">Title</th>
              <th>Type</th>
              <th>Chapter</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="py-2">{it.title}</td>
                <td>{it.type}</td>
                <td>{it.chapter.title}</td>
                <td>{it.isPublished ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Create content item</h2>
        <ContentForm
          chapters={chapters.map((c) => ({ id: c.id, label: `${c.subject.name}${c.subject.classLevel != null ? ` (${c.subject.classLevel})` : ""} • ${c.title}` }))}
        />
      </section>
    </div>
  );
}