import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad, json, parseJson } from "@/lib/http";

const Create = z.object({
  subjectId: z.string().cuid(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  order: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole("teacher");
  if ("error" in auth) return auth.error;
  const parsed = await parseJson(req, Create);
  if ("error" in parsed) return parsed.error;
  try {
    const chapter = await prisma.chapter.create({ data: parsed.data });
    return json(chapter, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Unique constraint")) return bad("Chapter with that slug already exists in this subject", 409);
    return bad(msg, 500);
  }
}