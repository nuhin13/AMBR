import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env, isProd } from "@/lib/env";
import { UserFacingError } from "@/lib/action-result";
import { logger } from "@/lib/logger";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);
const MAX_BYTES = 8 * 1024 * 1024;

export const cloudinaryConfigured = () => Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

export type StoredImage = { url: string; storageId: string; width: number | null; height: number | null };

/**
 * Stores an uploaded image. Uses Cloudinary (signed server-side upload) when configured;
 * in development falls back to /public/uploads. Production without Cloudinary is refused,
 * because serverless file systems are not persistent.
 */
export async function storeImage(file: File, folder = "products"): Promise<StoredImage> {
  const ext = ALLOWED.get(file.type);
  if (!ext) throw new UserFacingError("Please upload a JPG, PNG, WebP or AVIF image.");
  if (file.size > MAX_BYTES) throw new UserFacingError("Images must be 8 MB or smaller.");

  if (cloudinaryConfigured()) {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = `folder=ambr/${folder}&timestamp=${timestamp}`;
    const signature = createHash("sha1").update(params + env.CLOUDINARY_API_SECRET).digest("hex");
    const form = new FormData();
    form.append("file", file);
    form.append("folder", `ambr/${folder}`);
    form.append("timestamp", String(timestamp));
    form.append("api_key", env.CLOUDINARY_API_KEY!);
    form.append("signature", signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: form });
    const data = (await res.json()) as { secure_url?: string; public_id?: string; width?: number; height?: number; error?: { message: string } };
    if (!res.ok || !data.secure_url) throw new UserFacingError(`Image upload failed: ${data.error?.message ?? res.status}`);
    return { url: data.secure_url, storageId: data.public_id!, width: data.width ?? null, height: data.height ?? null };
  }

  if (isProd) throw new UserFacingError("Image storage isn't configured. Add Cloudinary keys to the server environment.");
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${folder}/${name}`, storageId: `local:${folder}/${name}`, width: null, height: null };
}

/** Deletes a stored image file (Cloudinary asset or local dev upload). Failures are logged, never thrown. */
export async function deleteStoredImage(storageId: string | null | undefined) {
  if (!storageId) return;
  try {
    if (storageId.startsWith("local:")) {
      const { unlink } = await import("node:fs/promises");
      const rel = storageId.slice("local:".length).replace(/\.\./g, "");
      await unlink(path.join(process.cwd(), "public", "uploads", rel)).catch(() => {});
      return;
    }
    if (!cloudinaryConfigured()) return;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1").update(`public_id=${storageId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`).digest("hex");
    const form = new FormData();
    form.append("public_id", storageId);
    form.append("timestamp", String(timestamp));
    form.append("api_key", env.CLOUDINARY_API_KEY!);
    form.append("signature", signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: "POST", body: form });
    if (!res.ok) logger.warn("media.delete_failed", { storageId, status: res.status });
  } catch (e) {
    logger.warn("media.delete_error", { storageId, error: e });
  }
}
