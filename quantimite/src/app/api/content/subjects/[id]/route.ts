import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad, json, parseJson } from "@/lib/http";

const Patch = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  isPublished: z.boolean().optional(),
  classLevel: z.number().int().min(0).max(20).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("teacher");
  if ("error" in auth) return auth.error;
  const parsed = await parseJson(req, Patch);
  if ("error" in parsed) return parsed.error;
  const subject = await prisma.subject.update({ where: { id: params.id }, data: parsed.data });
  return json(subject);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;
  // Soft delete
  await prisma.subject.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return json({ ok: true });
}