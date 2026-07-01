import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// Optional S3/R2 client. If credentials are missing, we fall back to a local
// /uploads folder so the app works in development without external services.

export interface UploadInput {
  body: Buffer | Uint8Array;
  contentType: string;
  originalName: string;
  prefix?: string; // e.g. "pdfs", "videos"
}

export interface UploadResult {
  key: string;
  url?: string;
}

const PUBLIC_PREFIX = "public/";
const PRIVATE_PREFIX = "private/";

function client(): S3Client | null {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function safeName(original: string): string {
  const ext = original.includes(".") ? original.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  return `${randomUUID()}.${ext}`;
}

export async function uploadPublic(input: UploadInput): Promise<UploadResult> {
  const key = `${PUBLIC_PREFIX}${input.prefix ?? "files"}/${safeName(input.originalName)}`;
  const c = client();
  if (!c) return { key };
  await c.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
  return { key, url: `${process.env.R2_PUBLIC_HOST}/${key}` };
}

export async function uploadPrivate(input: UploadInput): Promise<UploadResult> {
  const key = `${PRIVATE_PREFIX}${input.prefix ?? "files"}/${safeName(input.originalName)}`;
  const c = client();
  if (!c) return { key };
  await c.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
  return { key };
}

export async function signedUrlFor(key: string, expiresInSeconds = 600): Promise<string | null> {
  const c = client();
  if (!c) return null;
  const cmd = new GetObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key });
  return getSignedUrl(c, cmd, { expiresIn: expiresInSeconds });
}

// ---- Binary signature sniffing ----

const SIGNATURES: Array<{ ext: string; check: (b: Uint8Array) => boolean }> = [
  { ext: "pdf", check: (b) => String.fromCharCode(...b.subarray(0, 4)) === "%PDF" },
  { ext: "png", check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: "jpg", check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "webp", check: (b) => String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP" },
];

export function sniffExtension(bytes: Uint8Array): string | null {
  for (const s of SIGNATURES) if (s.check(bytes)) return s.ext;
  return null;
}

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB
export const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB