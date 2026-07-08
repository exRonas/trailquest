import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteReviewAdmin, fetchAllReviews } from '../api/reviews';
import { apiErrorMessage } from '../api/client';
import { pickLocalizedText } from '../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export function ReviewsPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: fetchAllReviews,
  });

  const delReview = useMutation({
    mutationFn: (id: string) => deleteReviewAdmin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  const onDelete = (id: string, routeTitle: string, userName: string) => {
    if (
      window.confirm(
        `Delete ${userName}'s review of "${routeTitle}"? This cannot be undone.`,
      )
    ) {
      delReview.mutate(id);
    }
  };

  return (
    <div className="container">
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Review moderation</h2>
      </div>

      {isLoading ? <div className="spinner">Loading reviews…</div> : null}
      {isError ? <div className="error">{apiErrorMessage(error)}</div> : null}
      {delReview.isError ? (
        <div className="error">{apiErrorMessage(delReview.error)}</div>
      ) : null}

      {(data ?? []).map((review) => {
        const routeTitle = pickLocalizedText({
          ru: review.route.titleRu,
          en: review.route.titleEn,
          kk: review.route.titleKk,
        });
        return (
          <div
            key={review.id}
            className="route-row"
            style={{ flexDirection: 'column', alignItems: 'stretch' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  <span style={{ color: '#d98a2b' }}>{stars(review.rating)}</span>{' '}
                  {routeTitle}
                </div>
                <div className="muted">
                  {review.user.name} · {formatDate(review.updatedAt)}
                </div>
                {review.comment ? <div style={{ marginTop: 6 }}>{review.comment}</div> : null}
              </div>
              <button
                className="danger"
                onClick={() => onDelete(review.id, routeTitle, review.user.name)}
                disabled={delReview.isPending}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}

      {data && data.length === 0 ? <div className="muted">No reviews yet.</div> : null}
    </div>
  );
}
