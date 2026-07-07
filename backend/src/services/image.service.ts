import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

/** Client is expected to compress well below this before uploading. */
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Matches an image URL this backend itself served (`.../api/images/<uuid>`),
 * regardless of host — so the same check works whether the app was hit via
 * localhost, LAN IP, or the Render domain. Anything else (an admin manually
 * pasting an external URL) is left alone by the orphan-cleanup logic below.
 */
const OWN_IMAGE_URL_RE =
  /\/api\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[/?#]|$)/i;

export interface SaveImageInput {
  /** Base64-encoded image bytes (no data: URL prefix). */
  data: string;
  mimeType: string;
}

export async function saveImage(input: SaveImageInput): Promise<{ id: string }> {
  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    throw AppError.badRequest('Unsupported image type');
  }
  const buffer = Buffer.from(input.data, 'base64');
  if (buffer.length === 0) {
    throw AppError.badRequest('Empty image data');
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw AppError.badRequest(
      `Image too large (${Math.round(buffer.length / 1024)}KB) — compress before uploading`,
    );
  }
  const image = await prisma.image.create({
    data: { data: buffer, mimeType: input.mimeType, size: buffer.length },
    select: { id: true },
  });
  return image;
}

export async function getImage(
  id: string,
): Promise<{ data: Buffer; mimeType: string } | null> {
  const image = await prisma.image.findUnique({
    where: { id },
    select: { data: true, mimeType: true },
  });
  if (!image) return null;
  return { data: Buffer.from(image.data), mimeType: image.mimeType };
}

/** Extract the image id from a URL if it points at our own /api/images/:id. */
export function ownImageId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = OWN_IMAGE_URL_RE.exec(url);
  return match ? match[1] : null;
}

/**
 * Delete the image a URL points to, but only if it's one we served ourselves
 * — never touches externally-pasted URLs. Safe to call with `null`/a URL
 * that's still referenced elsewhere (no-op if the row is already gone).
 */
export async function deleteImageIfOwned(url: string | null | undefined): Promise<void> {
  const id = ownImageId(url);
  if (!id) return;
  await prisma.image.deleteMany({ where: { id } });
}

/**
 * Given the "before" and "after" set of image URLs referenced by a route
 * (cover + all checkpoints), delete any of our own images that dropped out —
 * replaced, removed, or the checkpoint/route itself is gone. Never deletes an
 * id that's still present in `nextUrls` (covers the case of two fields
 * pointing at the same image).
 */
export async function cleanupOrphanedImages(
  previousUrls: (string | null | undefined)[],
  nextUrls: (string | null | undefined)[],
): Promise<void> {
  const keep = new Set(nextUrls.map(ownImageId).filter((id): id is string => !!id));
  const toDelete = previousUrls
    .map(ownImageId)
    .filter((id): id is string => !!id && !keep.has(id));
  if (toDelete.length === 0) return;
  await prisma.image.deleteMany({ where: { id: { in: toDelete } } });
}
