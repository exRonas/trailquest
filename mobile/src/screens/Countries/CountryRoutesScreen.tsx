import React, { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  EmptyState,
  ErrorState,
  Loader,
} from '../../components/ui';
import { RouteCard } from '../../components/RouteCard';
import { colors, spacing } from '../../theme';
import { useRoutes } from '../../api/hooks/useRoutes';
import { getApiErrorMessage } from '../../api/client';
import { useT } from '../../i18n';
import { ExploreScreenProps } from '../../types/navigation';

export function CountryRoutesScreen({
  route,
  navigation,
}: ExploreScreenProps<'CountryRoutes'>): React.ReactElement {
  const t = useT();
  const { country } = route.params;
  const { data, isLoading, isError, error, refetch } = useRoutes({ country });

  useEffect(() => {
    navigation.setOptions({ title: country });
  }, [navigation, country]);

  if (isLoading) return <Loader message={t('route.loading')} />;
  if (isError) {
    return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;
  }

  return (
    <FlatList
      style={styles.fill}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <RouteCard
          route={item}
          onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <EmptyState
            icon="map-search-outline"
            title={t('explore.noRoutesTitle')}
            message=""
          />
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  empty: { height: 320 },
});
