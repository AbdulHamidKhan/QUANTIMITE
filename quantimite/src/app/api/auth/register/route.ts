import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signAccessToken } from "@/lib/jwt";
import { generateRefreshToken, hashRefreshToken, REFRESH_COOKIE, REFRESH_TTL } from "@/lib/jwt";
import { bad, json, parseJson, getClientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120),
});

export async function POST(req: NextRequest) {
  const rl = rateLimit({ key: getClientIp(req), bucket: "register", limit: 10, windowMs: 60_000 });
  if (!rl.ok) return bad("Too many requests. Please wait.", 429);

  const parsed = await parseJson(req, Body);
  if ("error" in parsed) return parsed.error;

  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return bad("Email already in use", 409);

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: "student" },
    select: { id: true, email: true, name: true, role: true },
  });

  const access = await signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const { raw, hash, expiresAt } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt },
  });

  const res = json({ user, accessToken: access });
  res.cookies.set("qm_access", access, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });
  res.cookies.set(REFRESH_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFRESH_TTL,
  });
  return res;
}