import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { bad, json } from "@/lib/http";
import { uploadPrivate, uploadPublic, sniffExtension, MAX_PDF_BYTES, MAX_IMAGE_BYTES } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireRole("teacher");
  if ("error" in auth) return auth.error;

  const form = await req.formData().catch(() => null);
  if (!form) return bad("Multipart form expected");

  const file = form.get("file");
  const kind = (form.get("kind") as string | null) ?? "pdf";
  if (!(file instanceof File)) return bad("No file provided");

  const buf = new Uint8Array(await file.arrayBuffer());
  const detected = sniffExtension(buf);
  if (!detected) return bad("Unsupported file type", 415);

  if (kind === "pdf") {
    if (detected !== "pdf") return bad("File is not a PDF", 415);
    if (buf.byteLength > MAX_PDF_BYTES) return bad("PDF too large (max 50MB)", 413);
    const out = await uploadPrivate({ body: buf, contentType: "application/pdf", originalName: file.name, prefix: "pdfs" });
    return json(out);
  }
  if (kind === "image") {
    if (!["png", "jpg", "webp"].includes(detected)) return bad("Unsupported image", 415);
    if (buf.byteLength > MAX_IMAGE_BYTES) return bad("Image too large (max 5MB)", 413);
    const out = await uploadPublic({ body: buf, contentType: `image/${detected === "jpg" ? "jpeg" : detected}`, originalName: file.name, prefix: "images" });
    return json(out);
  }

  return bad("Unknown upload kind", 400);
}