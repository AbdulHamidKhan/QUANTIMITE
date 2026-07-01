import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  hashRefreshToken,
  REFRESH_COOKIE,
  REFRESH_TTL,
  generateRefreshToken,
  signAccessToken,
} from "@/lib/jwt";
import { bad, json } from "@/lib/http";

export async function POST(_req: NextRequest) {
  const raw = cookies().get(REFRESH_COOKIE)?.value;
  if (!raw) return bad("No refresh token", 401);

  const hash = hashRefreshToken(raw);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    return bad("Invalid refresh token", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user || user.deletedAt || !user.isActive) return bad("User unavailable", 401);

  // Rotate: revoke the old one, mint a new pair.
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

  const access = await signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const { raw: newRaw, hash: newHash, expiresAt } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: newHash, expiresAt },
  });

  const res = json({ accessToken: access, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  res.cookies.set("qm_access", access, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });
  res.cookies.set(REFRESH_COOKIE, newRaw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFRESH_TTL,
  });
  return res;
}