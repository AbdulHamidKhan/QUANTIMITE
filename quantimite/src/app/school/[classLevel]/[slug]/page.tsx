import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SubjectPage({
  params,
}: {
  params: { classLevel: string; slug: string };
}) {
  const classLevel = Number(params.classLevel);
  if (!Number.isFinite(classLevel)) notFound();

  const et = await prisma.educationType.findUnique({ where: { slug: "school" } });
  if (!et) notFound();

  const subject = await prisma.subject.findFirst({
    where: {
      educationTypeId: et.id,
      classLevel,
      slug: params.slug,
      isPublished: true,
      deletedAt: null,
    },
    include: {
      chapters: {
        where: { isPublished: true, deletedAt: null },
        orderBy: { order: "asc" },
        include: { _count: { select: { items: true } } },
      },
    },
  });
  if (!subject) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/school" className="hover:underline">School</Link> &rsaquo;{" "}
        Class {subject.classLevel} &rsaquo; {subject.name}
      </nav>
      <h1 className="text-3xl font-bold">{subject.name}</h1>
      {subject.description && <p className="text-slate-600">{subject.description}</p>}

      <section>
        <h2 className="text-xl font-semibold mb-3">Chapters</h2>
        {subject.chapters.length === 0 && (
          <p className="text-slate-500">No chapters published yet.</p>
        )}
        <ul className="divide-y divide-slate-200 border border-slate-200 rounded">
          {subject.chapters.map((c) => (
            <li key={c.id} className="flex justify-between items-center p-4">
              <Link
                href={`/school/${subject.classLevel}/${subject.slug}/${c.slug}`}
                className="font-medium hover:text-brand-600"
              >
                {c.order}. {c.title}
              </Link>
              <span className="text-xs text-slate-500">{c._count.items} item(s)</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}