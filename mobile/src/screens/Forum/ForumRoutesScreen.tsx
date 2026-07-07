import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppText, ErrorState, EmptyState, Loader } from '../../components/ui';
import { RouteCard } from '../../components/RouteCard';
import { colors, spacing } from '../../theme';
import { useRoutes } from '../../api/hooks/useRoutes';
import { getApiErrorMessage } from '../../api/client';
import { useT, usePickLocalized } from '../../i18n';
import { ForumScreenProps } from '../../types/navigation';

export function ForumRoutesScreen({
  navigation,
}: ForumScreenProps<'ForumRoutes'>): React.ReactElement {
  const t = useT();
  const pickLocalized = usePickLocalized();
  const { data, isLoading, isError, error, refetch, isRefetching } = useRoutes();

  if (isLoading) return <Loader message={t('forum.loadingDiscussions')} />;
  if (isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(error, t('forum.loadRoutesFailed'))}
        onRetry={refetch}
      />
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppText variant="title">{t('tab.forum')}</AppText>
          <AppText variant="callout" color={colors.textSecondary} style={styles.sub}>
            {t('forum.subtitle')}
          </AppText>
        </View>
      }
      renderItem={({ item }) => (
        <RouteCard
          route={item}
          onPress={() =>
            navigation.navigate('RoutePosts', {
              routeId: item.id,
              routeTitle: pickLocalized(item.title),
            })
          }
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="forum-outline"
          title={t('forum.noRoutesTitle')}
          message={t('forum.noRoutesMsg')}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
  header: { marginBottom: spacing.lg },
  sub: { marginTop: spacing.xs },
});
