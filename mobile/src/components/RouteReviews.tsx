import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Button, TextField } from './ui';
import { StarRating } from './StarRating';
import { Avatar } from './forum/Avatar';
import { colors, radius, spacing, useThemeColors } from '../theme';
import { formatRelativeTime } from '../utils/format';
import { useT } from '../i18n';
import {
  useDeleteReview,
  useReviews,
  useUpsertReview,
} from '../api/hooks/useReviews';
import { getApiErrorMessage } from '../api/client';
import { RouteReview } from '../types/api';

/**
 * The reviews block on Route Detail: aggregate stars, an editor for the
 * signed-in user's own rating (pre-filled when they've already rated), and the
 * list of everyone else's reviews.
 */
export function RouteReviews({ routeId }: { routeId: string }): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const { data } = useReviews(routeId);
  const upsert = useUpsertReview(routeId);
  const remove = useDeleteReview(routeId);

  const mine = data?.mine ?? null;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Pre-fill the editor from the user's existing review once it loads.
  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment);
    }
  }, [mine]);

  const onSubmit = () => {
    if (rating < 1) return;
    upsert.mutate(
      { rating, comment: comment.trim() },
      {
        onError: (err) =>
          Alert.alert(t('review.saveFailed'), getApiErrorMessage(err)),
      },
    );
  };

  const onRemove = () => {
    remove.mutate(undefined, {
      onSuccess: () => {
        setRating(0);
        setComment('');
      },
    });
  };

  const summary = data?.summary ?? { average: 0, count: 0 };
  const others = (data?.reviews ?? []).filter((r) => r.id !== mine?.id);

  return (
    <View>
      {/* Aggregate */}
      {summary.count > 0 ? (
        <View style={styles.summaryRow}>
          <AppText variant="display" style={styles.avg}>
            {summary.average.toFixed(1)}
          </AppText>
          <View style={styles.summaryMeta}>
            <StarRating value={summary.average} size={18} />
            <AppText variant="caption" color={colors.textSecondary}>
              {summary.count === 1
                ? t('review.countOne')
                : t('review.count', { count: summary.count })}
            </AppText>
          </View>
        </View>
      ) : (
        <AppText variant="callout" color={colors.textMuted} style={styles.empty}>
          {t('review.none')}
        </AppText>
      )}

      {/* Editor for the signed-in user */}
      <View style={[styles.editor, { backgroundColor: theme.primarySoft }]}>
        <AppText variant="bodyStrong">
          {mine ? t('review.yourRating') : t('review.rateThis')}
        </AppText>
        <View style={styles.editorStars}>
          <StarRating value={rating} size={30} onChange={setRating} />
        </View>
        <TextField
          value={comment}
          onChangeText={setComment}
          placeholder={t('review.commentPlaceholder')}
          multiline
          numberOfLines={3}
        />
        <View style={styles.editorActions}>
          <Button
            label={mine ? t('review.update') : t('review.submit')}
            onPress={onSubmit}
            disabled={rating < 1}
            loading={upsert.isPending}
            fullWidth={false}
            style={styles.submitBtn}
          />
          {mine ? (
            <Button
              label={t('review.remove')}
              variant="secondary"
              onPress={onRemove}
              loading={remove.isPending}
              fullWidth={false}
              style={styles.removeBtn}
            />
          ) : null}
        </View>
      </View>

      {/* Everyone else's reviews */}
      {others.map((r) => (
        <ReviewRow key={r.id} review={r} editedLabel={t('review.edited')} />
      ))}
    </View>
  );
}

function ReviewRow({
  review,
  editedLabel,
}: {
  review: RouteReview;
  editedLabel: string;
}): React.ReactElement {
  const wasEdited = review.updatedAt !== review.createdAt;
  return (
    <View style={styles.reviewRow}>
      <Avatar name={review.user.name} avatar={review.user.avatar} size={36} />
      <View style={styles.reviewBody}>
        <View style={styles.reviewHead}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.reviewName}>
            {review.user.name}
          </AppText>
          <AppText variant="label" color={colors.textMuted}>
            {formatRelativeTime(review.updatedAt)}
            {wasEdited ? ` · ${editedLabel}` : ''}
          </AppText>
        </View>
        <StarRating value={review.rating} size={14} />
        {review.comment ? (
          <AppText variant="callout" color={colors.textSecondary} style={styles.reviewComment}>
            {review.comment}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avg: { marginRight: spacing.lg },
  summaryMeta: { justifyContent: 'center' },
  empty: { marginBottom: spacing.md },
  editor: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  editorStars: { marginVertical: spacing.md },
  editorActions: { flexDirection: 'row', marginTop: spacing.md },
  submitBtn: { flex: 1, marginRight: spacing.sm },
  removeBtn: { flex: 1 },
  reviewRow: { flexDirection: 'row', paddingVertical: spacing.md },
  reviewBody: { flex: 1, marginLeft: spacing.md },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewName: { flex: 1, marginRight: spacing.sm },
  reviewComment: { marginTop: spacing.xs },
});
