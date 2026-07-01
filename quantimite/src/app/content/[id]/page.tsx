import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { signedUrlFor } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ContentPage({ params }: { params: { id: string } }) {
  const item = await prisma.contentItem.findFirst({
    where: { id: params.id, isPublished: true, deletedAt: null },
    include: { chapter: { include: { subject: { include: { educationType: true } } } } },
  });
  if (!item) notFound();

  const fileUrl =
    item.fileKey && item.type === "pdf" ? await signedUrlFor(item.fileKey, 600) : null;

  return (
    <article className="space-y-6 max-w-3xl mx-auto">
      <nav className="text-sm text-slate-500">
        <Link href="/school" className="hover:underline">
          {item.chapter.subject.educationType.name}
        </Link>{" "}
        &rsaquo;{" "}
        <Link
          href={`/school/${item.chapter.subject.classLevel}/${item.chapter.subject.slug}`}
          className="hover:underline"
        >
          {item.chapter.subject.name}
        </Link>{" "}
        &rsaquo;{" "}
        <Link
          href={`/school/${item.chapter.subject.classLevel}/${item.chapter.subject.slug}/${item.chapter.slug}`}
          className="hover:underline"
        >
          {item.chapter.title}
        </Link>
      </nav>

      <h1 className="text-3xl font-bold">{item.title}</h1>

      <ContentRenderer item={item} signedFileUrl={fileUrl} />
    </article>
  );
}

function ContentRenderer({
  item,
  signedFileUrl,
}: {
  item: Awaited<ReturnType<typeof prisma.contentItem.findFirst>> & object;
  signedFileUrl: string | null;
}) {
  if (!item) return null;
  if (item.type === "video") {
    if (!item.youtubeId) return <p className="text-slate-500">Video not available.</p>;
    return (
      <div className="aspect-video w-full rounded overflow-hidden border border-slate-200">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${item.youtubeId}`}
          title={item.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (item.type === "pdf") {
    if (!signedFileUrl) return <p className="text-slate-500">PDF not available.</p>;
    return (
      <iframe
        className="w-full h-[80vh] border border-slate-200 rounded"
        src={signedFileUrl}
        title={item.title}
      />
    );
  }
  if (item.type === "article" || item.type === "guideline") {
    return (
      <div
        className="prose-content"
        // Body is sanitized at write time (admin route uses sanitizeArticleHtml).
        dangerouslySetInnerHTML={{ __html: item.bodyHtml ?? "" }}
      />
    );
  }
  return <p className="text-slate-500">This content type isn't supported yet.</p>;
}