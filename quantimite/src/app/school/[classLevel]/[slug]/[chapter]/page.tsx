import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { plainExcerpt } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export default async function ChapterPage({
  params,
}: {
  params: { classLevel: string; slug: string; chapter: string };
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
  });
  if (!subject) notFound();

  const chapter = await prisma.chapter.findFirst({
    where: {
      subjectId: subject.id,
      slug: params.chapter,
      isPublished: true,
      deletedAt: null,
    },
    include: {
      items: {
        where: { isPublished: true, deletedAt: null },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!chapter) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/school" className="hover:underline">School</Link> &rsaquo;{" "}
        <Link href={`/school/${subject.classLevel}/${subject.slug}`} className="hover:underline">
          {subject.name}
        </Link>{" "}
        &rsaquo; {chapter.title}
      </nav>
      <h1 className="text-3xl font-bold">{chapter.title}</h1>

      {chapter.items.length === 0 && <p className="text-slate-500">No content in this chapter yet.</p>}

      <ul className="space-y-3">
        {chapter.items.map((it) => (
          <li key={it.id} className="border border-slate-200 rounded p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded">{it.type}</span>
              <span>#{it.order}</span>
            </div>
            <Link
              href={`/content/${it.id}`}
              className="block mt-1 text-lg font-medium hover:text-brand-600"
            >
              {it.title}
            </Link>
            {it.bodyHtml && (
              <p className="text-sm text-slate-600 mt-1">{plainExcerpt(it.bodyHtml, 140)}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}