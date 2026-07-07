import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Divider, ErrorState, Loader } from '../../components/ui';
import { Avatar } from '../../components/forum/Avatar';
import { colors, spacing, typography, useThemeColors } from '../../theme';
import { formatRelativeTime } from '../../utils/format';
import { usePost, useComments, useCreateComment } from '../../api/hooks/useForum';
import { getApiErrorMessage } from '../../api/client';
import { useT } from '../../i18n';
import { ForumComment } from '../../types/api';
import { ForumScreenProps } from '../../types/navigation';

export function PostDetailScreen({
  route,
  navigation,
}: ForumScreenProps<'PostDetail'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const { postId } = route.params;
  const insets = useSafeAreaInsets();

  const post = usePost(postId);
  const comments = useComments(postId);
  const createComment = useCreateComment(postId);

  const [text, setText] = useState('');

  const goToProfile = (userId: string, userName: string) =>
    navigation.navigate('UserProfile', { userId, userName });

  const onSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    createComment.mutate(trimmed);
  };

  if (post.isLoading) return <Loader message={t('forum.loadingPost')} />;
  if (post.isError || !post.data) {
    return (
      <ErrorState
        message={getApiErrorMessage(post.error, t('forum.loadPostFailed'))}
        onRetry={post.refetch}
      />
    );
  }

  const header = (
    <View>
      <Pressable
        style={styles.postHeader}
        onPress={() => goToProfile(post.data!.user.id, post.data!.user.name)}
      >
        <Avatar name={post.data.user.name} avatar={post.data.user.avatar} />
        <View style={styles.postHeaderText}>
          <AppText variant="bodyStrong">{post.data.user.name}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {formatRelativeTime(post.data.createdAt)}
          </AppText>
        </View>
      </Pressable>
      <AppText variant="title" style={styles.title}>
        {post.data.title}
      </AppText>
      <AppText variant="body" color={colors.text} style={styles.body}>
        {post.data.body}
      </AppText>
      <Divider />
      <AppText variant="subheading" style={styles.commentsHeading}>
        {t('forum.comments', {
          count: comments.data?.length ?? post.data._count.comments,
        })}
      </AppText>
      {comments.isError ? (
        <AppText variant="callout" color={colors.danger}>
          {getApiErrorMessage(comments.error, t('forum.loadPostsFailed'))}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={comments.data ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <CommentRow comment={item} onAuthorPress={goToProfile} />
        )}
        ListEmptyComponent={
          comments.isLoading ? (
            <View style={styles.commentsLoading}>
              <Loader />
            </View>
          ) : (
            <AppText
              variant="callout"
              color={colors.textMuted}
              style={styles.noComments}
            >
              {t('forum.noComments')}
            </AppText>
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          placeholder={t('forum.addComment')}
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable
          onPress={onSend}
          disabled={!text.trim()}
          style={[
            styles.send,
            { backgroundColor: theme.primary },
            !text.trim() ? styles.sendDisabled : null,
          ]}
        >
          <Icon name="send" size={20} color={colors.textInverse} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function CommentRow({
  comment,
  onAuthorPress,
}: {
  comment: ForumComment;
  onAuthorPress: (userId: string, userName: string) => void;
}): React.ReactElement {
  return (
    <View style={styles.commentRow}>
      <Pressable
        style={styles.commentAuthor}
        onPress={() => onAuthorPress(comment.user.id, comment.user.name)}
      >
        <Avatar name={comment.user.name} avatar={comment.user.avatar} size={32} />
      </Pressable>
      <View style={styles.commentBody}>
        <Pressable
          style={styles.commentMeta}
          onPress={() => onAuthorPress(comment.user.id, comment.user.name)}
        >
          <AppText variant="label">{comment.user.name}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {formatRelativeTime(comment.createdAt)}
          </AppText>
        </Pressable>
        <AppText variant="callout" color={colors.text} style={styles.commentText}>
          {comment.body}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  postHeader: { flexDirection: 'row', alignItems: 'center' },
  postHeaderText: { marginLeft: spacing.md },
  title: { marginTop: spacing.lg },
  body: { marginTop: spacing.md },
  commentsHeading: { marginBottom: spacing.md },
  commentsLoading: { height: 80 },
  noComments: { paddingVertical: spacing.lg },
  commentRow: { flexDirection: 'row', marginBottom: spacing.lg },
  commentAuthor: { alignSelf: 'flex-start' },
  commentBody: { flex: 1, marginLeft: spacing.md },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentText: { marginTop: 2 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    ...typography.body,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendDisabled: { opacity: 0.4 },
});
