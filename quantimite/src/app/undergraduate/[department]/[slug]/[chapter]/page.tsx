import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { plainExcerpt } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export default async function UniversityChapterPage({
  params,
}: {
  params: { department: string; slug: string; chapter: string };
}) {
  const et = await prisma.educationType.findUnique({ where: { slug: "university" } });
  if (!et) notFound();
  const dept = await prisma.department.findFirst({
    where: { id: params.department, educationTypeId: et.id, deletedAt: null },
  });
  if (!dept) notFound();
  const subject = await prisma.subject.findFirst({
    where: {
      educationTypeId: et.id,
      departmentId: dept.id,
      slug: params.slug,
      isPublished: true,
      deletedAt: null,
    },
  });
  if (!subject) notFound();
  const chapter = await prisma.chapter.findFirst({
    where: { subjectId: subject.id, slug: params.chapter, isPublished: true, deletedAt: null },
    include: { items: { where: { isPublished: true, deletedAt: null }, orderBy: { order: "asc" } } },
  });
  if (!chapter) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/undergraduate" className="hover:underline">Undergraduate</Link> &rsaquo;{" "}
        <Link href={`/undergraduate/${dept.id}/${subject.slug}`} className="hover:underline">
          {subject.name}
        </Link>{" "}
        &rsaquo; {chapter.title}
      </nav>
      <h1 className="text-3xl font-bold">{chapter.title}</h1>

      <ul className="space-y-3">
        {chapter.items.map((it) => (
          <li key={it.id} className="border border-slate-200 rounded p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {it.type} #{it.order}
            </div>
            <Link href={`/content/${it.id}`} className="block mt-1 text-lg font-medium hover:text-brand-600">
              {it.title}
            </Link>
            {it.bodyHtml && <p className="text-sm text-slate-600 mt-1">{plainExcerpt(it.bodyHtml, 140)}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}