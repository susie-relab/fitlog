import { supabase } from './supabase';

const BUCKET = 'activity-images';
const MAX_DIM = 1600;        // longest edge, px — the "full size" version shown in the detail view/lightbox
const QUALITY = 0.85;        // JPEG quality — light compression, still crisp
const THUMB_MAX_DIM = 240;   // longest edge, px — small variant for list-row/gallery previews
const THUMB_QUALITY = 0.7;

/** Draws a decoded bitmap onto a canvas scaled to at most maxDim on its longest edge, and
 *  re-encodes as JPEG at the given quality. */
async function drawScaled(bitmap: ImageBitmap, maxDim: number, quality: number): Promise<Blob> {
  const { width, height } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) throw new Error('Image encode failed');
  return blob;
}

/**
 * Downscale an image to at most MAX_DIM on its longest edge and re-encode as JPEG.
 * Handles orientation via the browser's native decode. Returns a JPEG Blob.
 */
export async function compressToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const blob = await drawScaled(bitmap, MAX_DIM, QUALITY);
  bitmap.close?.();
  return blob;
}

/**
 * Compress + upload one or more images for a user; returns both their full-size public URLs
 * (shown in the detail view/lightbox) and a small ~240px thumbnail variant (list-row/gallery
 * previews), so browsing a long list doesn't pull down every full-size photo. Files are stored
 * under `<userId>/…` so per-user RLS policies apply.
 */
export async function uploadImages(userId: string, files: File[]): Promise<{ urls: string[]; thumbUrls: string[] }> {
  const urls: string[] = [];
  const thumbUrls: string[] = [];
  for (const file of files) {
    const bitmap = await createImageBitmap(file);
    const [full, thumb] = await Promise.all([
      drawScaled(bitmap, MAX_DIM, QUALITY),
      drawScaled(bitmap, THUMB_MAX_DIM, THUMB_QUALITY),
    ]);
    bitmap.close?.();

    const id = crypto.randomUUID();
    const path = `${userId}/${id}.jpg`;
    const thumbPath = `${userId}/${id}_thumb.jpg`;
    const [fullUp, thumbUp] = await Promise.all([
      supabase.storage.from(BUCKET).upload(path, full, { contentType: 'image/jpeg', upsert: false }),
      supabase.storage.from(BUCKET).upload(thumbPath, thumb, { contentType: 'image/jpeg', upsert: false }),
    ]);
    if (fullUp.error) throw fullUp.error;
    if (thumbUp.error) throw thumbUp.error;
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    thumbUrls.push(supabase.storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl);
  }
  return { urls, thumbUrls };
}

/** Best-effort delete of an uploaded image (and its thumbnail, if any) by the full-size public
 *  URL — ignores failures. The thumbnail path is derived from the full path (same id, `_thumb`
 *  suffix), so this is safe to call even for older images that never got a thumbnail uploaded. */
export async function deleteImage(url: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  const thumbPath = path.replace(/\.jpg$/, '_thumb.jpg');
  await supabase.storage.from(BUCKET).remove([path, thumbPath]);
}
