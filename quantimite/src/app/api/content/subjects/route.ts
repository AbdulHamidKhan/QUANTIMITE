import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad, json, parseJson } from "@/lib/http";
import { PageQuery, buildPageMeta, offsetOf } from "@/lib/pagination";

const Create = z.object({
  educationTypeSlug: z.enum(["school", "university", "abroad"]),
  departmentId: z.string().cuid().nullable().optional(),
  classLevel: z.number().int().min(0).max(20).nullable().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and dashes only"),
  description: z.string().max(2000).optional(),
  isPublished: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const auth = await requireRole("teacher");
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const parsed = PageQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return bad("Invalid pagination", 422);
  const { page, pageSize } = parsed.data;

  const [items, total] = await Promise.all([
    prisma.subject.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip: offsetOf(page, pageSize),
      take: pageSize,
      include: { educationType: true, department: true, _count: { select: { chapters: true } } },
    }),
    prisma.subject.count({ where: { deletedAt: null } }),
  ]);

  return json({ items, page: buildPageMeta(parsed.data, total) });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole("teacher");
  if ("error" in auth) return auth.error;

  const parsed = await parseJson(req, Create);
  if ("error" in parsed) return parsed.error;
  const data = parsed.data;

  const et = await prisma.educationType.findUnique({ where: { slug: data.educationTypeSlug } });
  if (!et) return bad("Unknown education type", 422);

  try {
    const subject = await prisma.subject.create({
      data: {
        educationTypeId: et.id,
        departmentId: data.departmentId ?? null,
        classLevel: data.classLevel ?? null,
        name: data.name,
        slug: data.slug,
        description: data.description,
        isPublished: data.isPublished,
      },
    });
    return json(subject, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Unique constraint")) return bad("Subject already exists for that level", 409);
    return bad(msg, 500);
  }
}