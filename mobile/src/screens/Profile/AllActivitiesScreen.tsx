import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, Loader } from '../../components/ui';
import { ProgressRow } from '../../components/ProgressRow';
import { colors, spacing } from '../../theme';
import { useMyProgress } from '../../api/hooks/useProgress';
import { getApiErrorMessage } from '../../api/client';
import { useT } from '../../i18n';
import { ProfileScreenProps } from '../../types/navigation';

export function AllActivitiesScreen({
  navigation,
}: ProfileScreenProps<'AllActivities'>): React.ReactElement {
  const t = useT();
  const { data, isLoading, isError, error, refetch, isRefetching } = useMyProgress();

  if (isLoading) return <Loader message={t('profile.loading')} />;
  if (isError) {
    return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;
  }

  return (
    <FlatList
      style={styles.fill}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      onRefresh={refetch}
      refreshing={isRefetching}
      renderItem={({ item }) => (
        <ProgressRow
          session={item}
          onPress={() => navigation.navigate('ActivityDetail', { progressId: item.id })}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <EmptyState
            icon="hiking"
            title={t('profile.noRoutesTitle')}
            message={t('profile.noRoutesMsg')}
          />
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
  empty: { paddingTop: spacing.xxl },
});
