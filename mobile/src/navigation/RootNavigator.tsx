import React, { useEffect, useMemo } from 'react';
import { AppState, View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  NavigationContainer,
  DefaultTheme,
  Theme,
} from '@react-navigation/native';
import { Loader } from '../components/ui';
import { UpdateBanner } from '../components/UpdateBanner';
import { colors, useThemeColors } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useLocaleStore } from '../i18n';
import { initMapbox } from '../services/mapbox';
import { syncAll } from '../services/offlineQueue';
import { hydrateRoutesCache } from '../services/routesCache';
import { queryClient } from '../api/queryClient';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';

export function RootNavigator(): React.ReactElement {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const theme = useThemeColors();

  const navTheme: Theme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: theme.primary,
        background: theme.background,
        card: theme.surface,
        text: theme.text,
        border: theme.border,
        notification: theme.accent,
      },
    }),
    [theme],
  );

  useEffect(() => {
    initMapbox();
    void hydrateLocale();
    void hydrate();
    // Seed the Explore list from disk so a cold offline launch isn't empty.
    void hydrateRoutesCache(queryClient);
  }, [hydrate, hydrateLocale]);

  // Flush any offline-queued route sessions (see offlineQueue.ts) whenever
  // connectivity returns or the app comes back to the foreground.
  useEffect(() => {
    if (status !== 'authenticated') return undefined;

    const netSub = NetInfo.addEventListener((state) => {
      if (state.isConnected) void syncAll();
    });
    const appSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void syncAll();
    });
    void syncAll();

    return () => {
      netSub();
      appSub.remove();
    };
  }, [status]);

  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <Loader message="TrailQuest" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'authenticated' ? <MainTabs /> : <AuthNavigator />}
      <UpdateBanner />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.background },
});
