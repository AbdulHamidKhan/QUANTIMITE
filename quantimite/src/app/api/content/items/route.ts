import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad, json, parseJson } from "@/lib/http";
import { sanitizeArticleHtml } from "@/lib/sanitize";

const Create = z.object({
  chapterId: z.string().cuid(),
  type: z.enum(["video", "pdf", "article", "quiz", "guideline"]),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  order: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
  youtubeId: z.string().min(3).max(40).optional(),
  fileKey: z.string().max(500).optional(),
  mimeType: z.string().max(120).optional(),
  fileBytes: z.number().int().nonnegative().optional(),
  bodyHtml: z.string().max(200_000).optional(),
  meta: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole("teacher");
  if ("error" in auth) return auth.error;
  const parsed = await parseJson(req, Create);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;

  // Defense-in-depth: sanitize at write time too.
  const bodyHtml =
    (d.type === "article" || d.type === "guideline") && d.bodyHtml
      ? sanitizeArticleHtml(d.bodyHtml)
      : d.bodyHtml;

  try {
    const item = await prisma.contentItem.create({
      data: {
        chapterId: d.chapterId,
        type: d.type,
        title: d.title,
        slug: d.slug,
        order: d.order,
        isPublished: d.isPublished,
        youtubeId: d.youtubeId,
        fileKey: d.fileKey,
        mimeType: d.mimeType,
        fileBytes: d.fileBytes,
        bodyHtml,
        meta: d.meta ? (d.meta as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
    return json(item, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Unique constraint")) return bad("Item with that slug already exists in this chapter", 409);
    return bad(msg, 500);
  }
}