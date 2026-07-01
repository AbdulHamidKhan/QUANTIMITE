import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function UniversitySubjectPage({
  params,
}: {
  params: { department: string; slug: string };
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
    include: {
      chapters: {
        where: { isPublished: true, deletedAt: null },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!subject) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/undergraduate" className="hover:underline">Undergraduate</Link> &rsaquo;{" "}
        {dept.name} &rsaquo; {subject.name}
      </nav>
      <h1 className="text-3xl font-bold">{subject.name}</h1>
      {subject.description && <p className="text-slate-600">{subject.description}</p>}

      <ul className="divide-y divide-slate-200 border border-slate-200 rounded">
        {subject.chapters.map((c) => (
          <li key={c.id} className="p-4 flex justify-between">
            <Link
              href={`/undergraduate/${dept.id}/${subject.slug}/${c.slug}`}
              className="font-medium hover:text-brand-600"
            >
              {c.order}. {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}