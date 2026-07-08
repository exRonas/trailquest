import { api, unwrap } from './client';
import { RouteReview, RouteReviewsResponse } from '../types/api';

export async function fetchReviews(
  routeId: string,
): Promise<RouteReviewsResponse> {
  const res = await api.get<{ data: RouteReviewsResponse }>(
    `/routes/${routeId}/reviews`,
  );
  return unwrap(res.data);
}

export async function upsertReview(
  routeId: string,
  input: { rating: number; comment: string },
): Promise<RouteReview> {
  const res = await api.put<{ data: RouteReview }>(
    `/routes/${routeId}/reviews`,
    input,
  );
  return unwrap(res.data);
}

export async function deleteReview(routeId: string): Promise<void> {
  await api.delete(`/routes/${routeId}/reviews`);
}
