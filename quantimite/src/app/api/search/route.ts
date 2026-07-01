import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { json } from "@/lib/http";

// Lightweight search across content items and abroad guides.
// If MEILI_HOST is configured, swap this implementation to Meilisearch without
// changing the request/response shape.

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(50, Number(url.searchParams.get("limit") ?? 20));
  if (q.length < 2) return json({ q, hits: [] });

  // Optional Meilisearch branch
  if (process.env.MEILI_HOST && process.env.MEILI_MASTER_KEY) {
    try {
      const r = await fetch(`${process.env.MEILI_HOST}/indexes/content/search`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${process.env.MEILI_MASTER_KEY}` },
        body: JSON.stringify({ q, limit }),
      });
      const data = await r.json();
      return json({ q, hits: data.hits ?? [], source: "meili" });
    } catch {
      // fall through to DB
    }
  }

  const [items, guides] = await Promise.all([
    prisma.contentItem.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { bodyHtml: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      include: { chapter: { include: { subject: { include: { educationType: true } } } } },
    }),
    prisma.guide.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
          { bodyHtml: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
    }),
  ]);

  const hits = [
    ...items.map((i) => ({
      kind: "content" as const,
      id: i.id,
      title: i.title,
      type: i.type,
      path: `/content/${i.id}`,
      breadcrumb: `${i.chapter.subject.educationType.name} › ${i.chapter.subject.name} › ${i.chapter.title}`,
    })),
    ...guides.map((g) => ({
      kind: "guide" as const,
      id: g.id,
      title: g.title,
      type: "guideline" as const,
      path: `/abroad/${g.id}`,
      breadcrumb: `Abroad › ${g.country}`,
    })),
  ];

  return json({ q, hits, source: "db" });
}