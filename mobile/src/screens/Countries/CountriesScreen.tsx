import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppText,
  Card,
  EmptyState,
  ErrorState,
  Loader,
} from '../../components/ui';
import { colors, spacing, useThemeColors } from '../../theme';
import { useCountries } from '../../api/hooks/useRoutes';
import { getApiErrorMessage } from '../../api/client';
import { useT } from '../../i18n';
import { ExploreScreenProps } from '../../types/navigation';

export function CountriesScreen({
  navigation,
}: ExploreScreenProps<'Countries'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const { data, isLoading, isError, error, refetch } = useCountries();

  if (isLoading) return <Loader message={t('explore.finding')} />;
  if (isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(error)}
        onRetry={refetch}
      />
    );
  }

  return (
    <FlatList
      style={[styles.fill, { backgroundColor: theme.background }]}
      data={data ?? []}
      keyExtractor={(item) => item.country}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
          {t('countries.subtitle')}
        </AppText>
      }
      renderItem={({ item }) => (
        <Card
          onPress={() =>
            navigation.navigate('CountryRoutes', { country: item.country })
          }
          style={styles.row}
        >
          <View style={styles.rowInner}>
            <View style={[styles.flagDot, { backgroundColor: theme.primarySoft }]}>
              <Icon name="map-marker" size={20} color={theme.primary} />
            </View>
            <View style={styles.rowText}>
              <AppText variant="bodyStrong">{item.country}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {item.routeCount === 1
                  ? t('countries.routeCountOne')
                  : t('countries.routeCount', { count: item.routeCount })}
              </AppText>
            </View>
            <Icon name="chevron-right" size={22} color={colors.textMuted} />
          </View>
        </Card>
      )}
      ListEmptyComponent={
        <EmptyState icon="earth-off" title={t('countries.empty')} message="" />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  subtitle: { marginBottom: spacing.lg },
  row: { marginBottom: spacing.md },
  rowInner: { flexDirection: 'row', alignItems: 'center' },
  flagDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowText: { flex: 1 },
});
