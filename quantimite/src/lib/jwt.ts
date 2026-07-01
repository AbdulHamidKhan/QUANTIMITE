import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { createHash, randomBytes } from "crypto";

const ACCESS_TTL = "15m";
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function key(secret: string | undefined, fallback: string): Uint8Array {
  const value = secret ?? fallback;
  return new TextEncoder().encode(value);
}

export interface AccessClaims extends JWTPayload {
  sub: string;
  role: "student" | "teacher" | "admin" | "superadmin";
  email: string;
}

export async function signAccessToken(payload: AccessClaims): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(key(process.env.JWT_ACCESS_SECRET, "dev-access-secret"));
}

export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key(process.env.JWT_ACCESS_SECRET, "dev-access-secret"));
    return payload as AccessClaims;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = randomBytes(48).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
  return { raw, hash, expiresAt };
}

export function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export const REFRESH_COOKIE = "qm_refresh";
export const REFRESH_TTL = REFRESH_TTL_SECONDS;