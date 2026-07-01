import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { verifyAccessToken, type AccessClaims } from "./jwt";

export const REFRESH_COOKIE = "qm_refresh";

export type Session = {
  userId: string;
  email: string;
  role: Role;
};

const ROLE_RANK: Record<Role, number> = {
  student: 1,
  teacher: 2,
  admin: 3,
  superadmin: 4,
};

export async function getSession(): Promise<Session | null> {
  const h = headers();
  const auth = h.get("authorization");
  let token: string | null = null;
  if (auth && auth.toLowerCase().startsWith("bearer ")) token = auth.slice(7);

  if (!token) {
    const c = cookies();
    const cookieToken = c.get("qm_access")?.value;
    if (cookieToken) token = cookieToken;
  }

  if (!token) return null;
  const claims = await verifyAccessToken(token);
  if (!claims) return null;
  return { userId: claims.sub, email: claims.email, role: claims.role };
}

export async function requireSession(): Promise<Session | { error: NextResponse }> {
  const s = await getSession();
  if (!s) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return s;
}

export async function requireRole(min: Role): Promise<Session | { error: NextResponse }> {
  const s = await requireSession();
  if ("error" in s) return s;
  if (ROLE_RANK[s.role] < ROLE_RANK[min]) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return s;
}

export function hasRole(session: Session | null, min: Role): boolean {
  if (!session) return false;
  return ROLE_RANK[session.role] >= ROLE_RANK[min];
}

export type { AccessClaims };