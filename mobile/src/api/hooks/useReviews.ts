import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteReview, fetchReviews, upsertReview } from '../reviews.api';
import { queryKeys } from '../queryClient';

export function useReviews(routeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews(routeId ?? 'none'),
    queryFn: () => fetchReviews(routeId as string),
    enabled: !!routeId,
  });
}

/** After a review changes, the route's aggregate rating (shown on the detail
 *  header and Explore cards) is stale — invalidate both the reviews list and
 *  the routes queries so the stars update. */
function invalidateAfterReviewChange(
  qc: ReturnType<typeof useQueryClient>,
  routeId: string,
) {
  qc.invalidateQueries({ queryKey: queryKeys.reviews(routeId) });
  qc.invalidateQueries({ queryKey: queryKeys.route(routeId) });
  qc.invalidateQueries({ queryKey: ['routes'] });
}

export function useUpsertReview(routeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { rating: number; comment: string }) =>
      upsertReview(routeId, input),
    onSuccess: () => invalidateAfterReviewChange(qc, routeId),
  });
}

export function useDeleteReview(routeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteReview(routeId),
    onSuccess: () => invalidateAfterReviewChange(qc, routeId),
  });
}
