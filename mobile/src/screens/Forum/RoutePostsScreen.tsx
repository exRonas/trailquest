import React, { useLayoutEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ErrorState, EmptyState, Loader } from '../../components/ui';
import { PostCard } from '../../components/forum/PostCard';
import { colors, shadow, spacing } from '../../theme';
import { usePosts } from '../../api/hooks/useForum';
import { getApiErrorMessage } from '../../api/client';
import { useT } from '../../i18n';
import { ForumScreenProps } from '../../types/navigation';

export function RoutePostsScreen({
  route,
  navigation,
}: ForumScreenProps<'RoutePosts'>): React.ReactElement {
  const t = useT();
  const { routeId, routeTitle } = route.params;
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    usePosts(routeId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: routeTitle });
  }, [navigation, routeTitle]);

  const renderBody = () => {
    if (isLoading) return <Loader message={t('forum.loadingPosts')} />;
    if (isError) {
      return (
        <ErrorState
          message={getApiErrorMessage(error, t('forum.loadPostsFailed'))}
          onRetry={refetch}
        />
      );
    }
    return (
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        onRefresh={refetch}
        refreshing={isRefetching}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() =>
              navigation.navigate('PostDetail', {
                postId: item.id,
                postTitle: item.title,
              })
            }
            onAuthorPress={() =>
              navigation.navigate('UserProfile', {
                userId: item.user.id,
                userName: item.user.name,
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="chat-plus-outline"
            title={t('forum.noPostsTitle')}
            message={t('forum.noPostsMsg')}
            actionLabel={t('forum.writePost')}
            onAction={() => navigation.navigate('CreatePost', { routeId })}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.fill}>
      {renderBody()}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={() => navigation.navigate('CreatePost', { routeId })}
      >
        <Icon name="plus" size={26} color={colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 96 },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
});
