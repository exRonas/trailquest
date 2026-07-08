import { api, unwrap } from './client';
import { AdminReview } from '../types';

export async function fetchAllReviews(): Promise<AdminReview[]> {
  const res = await api.get<{ data: AdminReview[] }>('/reviews');
  return unwrap(res.data);
}

export async function deleteReviewAdmin(reviewId: string): Promise<void> {
  await api.delete(`/reviews/${reviewId}`);
}
