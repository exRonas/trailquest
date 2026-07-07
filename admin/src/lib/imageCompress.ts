/**
 * Client-side compression before upload: resize to fit within maxDimension
 * and re-encode as JPEG at the given quality. Keeps uploaded rows small (the
 * backend stores images as a Postgres blob — see image.service.ts) without
 * needing a separate image-processing service.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export interface CompressedImage {
  /** Base64-encoded bytes, no `data:` URL prefix. */
  data: string;
  mimeType: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image file'));
    };
    img.src = url;
  });
}

export async function compressImageFile(file: File): Promise<CompressedImage> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const [, base64] = dataUrl.split(',');
  return { data: base64, mimeType: 'image/jpeg' };
}
