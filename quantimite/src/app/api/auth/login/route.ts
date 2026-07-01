import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signAccessToken, generateRefreshToken, REFRESH_COOKIE, REFRESH_TTL } from "@/lib/jwt";
import { bad, json, parseJson, getClientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: ip, bucket: "login", limit: 5, windowMs: 15 * 60_000 });
  if (!rl.ok) return bad("Too many login attempts. Try again later.", 429);

  const parsed = await parseJson(req, Body);
  if ("error" in parsed) return parsed.error;

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || !user.isActive) {
    return bad("Invalid credentials", 401);
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return bad("Invalid credentials", 401);

  const access = await signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const { raw, hash, expiresAt } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt },
  });

  const res = json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken: access,
  });
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