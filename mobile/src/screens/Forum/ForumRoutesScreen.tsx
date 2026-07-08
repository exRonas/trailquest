import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, ErrorState, EmptyState, Loader } from '../../components/ui';
import { RouteCard } from '../../components/RouteCard';
import { colors, spacing, useThemeColors } from '../../theme';
import { useRoutes } from '../../api/hooks/useRoutes';
import { getApiErrorMessage } from '../../api/client';
import { getCurrentPosition } from '../../services/geolocation';
import { haversineMeters } from '../../utils/geo';
import { useT, usePickLocalized } from '../../i18n';
import { RouteSummary } from '../../types/api';
import { ForumScreenProps } from '../../types/navigation';

export function ForumRoutesScreen({
  navigation,
}: ForumScreenProps<'ForumRoutes'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const pickLocalized = usePickLocalized();
  const { data, isLoading, isError, error, refetch, isRefetching } = useRoutes();

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Try to get the user's location once so nearby routes can sort to the top.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pos = await getCurrentPosition();
      if (!cancelled && pos) setUserPos({ lat: pos.lat, lng: pos.lng });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nearby routes first (by distance), routes without coordinates or when we
  // don't have a location keep the server order at the end.
  const sorted = useMemo(() => {
    const all = data ?? [];
    if (!userPos) return all;
    const distance = (r: RouteSummary) =>
      r.startLat != null && r.startLng != null
        ? haversineMeters(userPos, { lat: r.startLat, lng: r.startLng })
        : Infinity;
    return [...all].sort((a, b) => distance(a) - distance(b));
  }, [data, userPos]);

  const openCountries = () =>
    navigation.navigate('ExploreTab', { screen: 'Countries' });

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
      style={[styles.list, { backgroundColor: theme.background }]}
      data={sorted}
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
          <AppText variant="caption" color={colors.textMuted} style={styles.sub}>
            {userPos ? t('explore.nearYou') : t('explore.allRoutes')}
          </AppText>

          <Pressable
            style={[styles.browseRow, { backgroundColor: theme.primarySoft }]}
            onPress={openCountries}
          >
            <Icon name="earth" size={20} color={theme.primary} />
            <AppText
              variant="bodyStrong"
              color={theme.primary}
              style={styles.browseText}
            >
              {t('explore.browseByCountry')}
            </AppText>
            <Icon name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
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
  browseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    marginTop: spacing.md,
  },
  browseText: { flex: 1, marginLeft: spacing.sm },
});
