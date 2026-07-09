import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Card } from '../ui';
import { Avatar } from './Avatar';
import { spacing, useDesignVersion, useThemeColors } from '../../theme';
import { formatRelativeTime } from '../../utils/format';
import { useT } from '../../i18n';
import { ForumPost } from '../../types/api';

interface PostCardProps {
  post: ForumPost;
  onPress: () => void;
  onAuthorPress: () => void;
}

export function PostCard({
  post,
  onPress,
  onAuthorPress,
}: PostCardProps): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const design = useDesignVersion();
  const atlas = design === 'v3';
  const commentsLabel =
    post._count.comments === 1
      ? t('forum.commentCountOne')
      : t('forum.commentCount', { count: post._count.comments });

  return (
    <Card onPress={onPress} style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={(e) => {
          e.stopPropagation();
          onAuthorPress();
        }}
      >
        <Avatar name={post.user.name} avatar={post.user.avatar} />
        <View style={styles.headerText}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {post.user.name}
          </AppText>
          <AppText
            variant={atlas ? 'overline' : 'caption'}
            color={theme.textMuted}
          >
            {formatRelativeTime(post.createdAt)}
          </AppText>
        </View>
        {atlas ? (
          // Comment counter as a terracotta stamp, journal-margin style.
          <View style={[styles.atlasStamp, { backgroundColor: theme.accentSoft }]}>
            <Icon name="comment-outline" size={13} color={theme.accent} />
            <AppText variant="label" color={theme.accent} style={styles.count}>
              {post._count.comments}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      {atlas ? (
        <View style={[styles.atlasDivider, { borderColor: theme.border }]} />
      ) : null}

      <AppText variant="subheading" style={styles.title} numberOfLines={2}>
        {post.title}
      </AppText>
      <AppText
        variant="callout"
        color={theme.textSecondary}
        numberOfLines={2}
        style={styles.body}
      >
        {post.body}
      </AppText>

      {!atlas ? (
        <View style={styles.footer}>
          <Icon name="comment-outline" size={15} color={theme.textMuted} />
          <AppText variant="label" color={theme.textSecondary} style={styles.count}>
            {commentsLabel}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerText: { marginLeft: spacing.md, flex: 1 },
  title: { marginTop: spacing.md },
  body: { marginTop: spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  count: { marginLeft: 4 },

  // Atlas (v3)
  atlasStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginLeft: spacing.sm,
  },
  atlasDivider: {
    borderTopWidth: 1.2,
    borderStyle: 'dashed',
    marginTop: spacing.md,
    marginBottom: -spacing.xs,
  },
});
