import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GuidePage({ params }: { params: { id: string } }) {
  const et = await prisma.educationType.findUnique({ where: { slug: "abroad" } });
  if (!et) notFound();
  const guide = await prisma.guide.findFirst({
    where: { id: params.id, educationTypeId: et.id, isPublished: true, deletedAt: null },
  });
  if (!guide) notFound();

  return (
    <article className="space-y-6 max-w-3xl mx-auto">
      <nav className="text-sm text-slate-500">
        <Link href="/abroad" className="hover:underline">Abroad</Link> &rsaquo; {guide.country}
      </nav>
      <div className="text-xs uppercase tracking-wide text-slate-500">{guide.category}</div>
      <h1 className="text-3xl font-bold">{guide.title}</h1>
      {guide.bodyHtml && (
        <div className="prose-content" dangerouslySetInnerHTML={{ __html: guide.bodyHtml }} />
      )}
    </article>
  );
}