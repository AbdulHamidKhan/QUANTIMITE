import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad, json, parseJson } from "@/lib/http";
import { sanitizeArticleHtml } from "@/lib/sanitize";

const Patch = z.object({
  title: z.string().min(1).max(200).optional(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  youtubeId: z.string().min(3).max(40).nullable().optional(),
  fileKey: z.string().max(500).nullable().optional(),
  bodyHtml: z.string().max(200_000).optional(),
  meta: z.record(z.unknown()).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("teacher");
  if ("error" in auth) return auth.error;
  const parsed = await parseJson(req, Patch);
  if ("error" in parsed) return parsed.error;

  const existing = await prisma.contentItem.findUnique({ where: { id: params.id } });
  if (!existing) return bad("Not found", 404);

  const isText = existing.type === "article" || existing.type === "guideline";
  const data: Record<string, unknown> = { ...parsed.data };
  if (isText && typeof data.bodyHtml === "string") data.bodyHtml = sanitizeArticleHtml(data.bodyHtml);
  if ("meta" in data) data.meta = data.meta == null ? Prisma.JsonNull : (data.meta as Prisma.InputJsonValue);

  const item = await prisma.contentItem.update({ where: { id: params.id }, data });
  return json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;
  await prisma.contentItem.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return json({ ok: true });
}