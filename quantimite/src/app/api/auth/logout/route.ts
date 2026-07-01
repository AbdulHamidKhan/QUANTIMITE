import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashRefreshToken, REFRESH_COOKIE } from "@/lib/jwt";
import { json } from "@/lib/http";

export async function POST() {
  const raw = cookies().get(REFRESH_COOKIE)?.value;
  if (raw) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  const res = json({ ok: true });
  res.cookies.set("qm_access", "", { path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}