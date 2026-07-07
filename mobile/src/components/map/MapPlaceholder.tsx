import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Banner } from '../ui';
import { colors, spacing } from '../../theme';

/**
 * Shown in place of the live map when no Mapbox public token is configured, so
 * the app remains usable (the route list still works) and the developer is told
 * exactly what to do.
 */
export function MapPlaceholder(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Icon name="map-outline" size={48} color={colors.primary} />
      <AppText variant="subheading" center style={styles.title}>
        Map unavailable
      </AppText>
      <Banner
        tone="info"
        message="Set MAPBOX_PUBLIC_TOKEN in mobile/.env to enable the map. See the README for setup."
        style={styles.banner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.xl,
  },
  title: { marginTop: spacing.md },
  banner: { marginTop: spacing.lg },
});
