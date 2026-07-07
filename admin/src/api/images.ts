import { api, unwrap } from './client';
import { compressImageFile } from '../lib/imageCompress';

/** Compress a picked file client-side, upload it, return the served URL. */
export async function uploadImageFile(file: File): Promise<string> {
  const { data, mimeType } = await compressImageFile(file);
  const res = await api.post<{ data: { id: string; url: string } }>('/images', {
    data,
    mimeType,
  });
  return unwrap(res.data).url;
}
