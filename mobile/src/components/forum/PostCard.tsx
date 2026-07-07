import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Card } from '../ui';
import { Avatar } from './Avatar';
import { colors, spacing } from '../../theme';
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
          <AppText variant="caption" color={colors.textMuted}>
            {formatRelativeTime(post.createdAt)}
          </AppText>
        </View>
      </Pressable>

      <AppText variant="subheading" style={styles.title} numberOfLines={2}>
        {post.title}
      </AppText>
      <AppText
        variant="callout"
        color={colors.textSecondary}
        numberOfLines={2}
        style={styles.body}
      >
        {post.body}
      </AppText>

      <View style={styles.footer}>
        <Icon name="comment-outline" size={15} color={colors.textMuted} />
        <AppText variant="label" color={colors.textSecondary} style={styles.count}>
          {post._count.comments === 1
            ? t('forum.commentCountOne')
            : t('forum.commentCount', { count: post._count.comments })}
        </AppText>
      </View>
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
});
