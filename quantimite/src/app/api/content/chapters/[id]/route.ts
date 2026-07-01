import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad, json, parseJson } from "@/lib/http";

const Patch = z.object({
  title: z.string().min(1).max(200).optional(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("teacher");
  if ("error" in auth) return auth.error;
  const parsed = await parseJson(req, Patch);
  if ("error" in parsed) return parsed.error;
  const chapter = await prisma.chapter.update({ where: { id: params.id }, data: parsed.data });
  return json(chapter);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;
  await prisma.chapter.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return json({ ok: true });
}