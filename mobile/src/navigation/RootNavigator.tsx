import React, { useEffect, useMemo } from 'react';
import { AppState, StatusBar, View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  LinkingOptions,
  Theme,
} from '@react-navigation/native';
import { Loader } from '../components/ui';
import { useThemeColors, useIsDark, useThemeStore } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useLocaleStore } from '../i18n';
import { initMapbox } from '../services/mapbox';
import { syncAll } from '../services/offlineQueue';
import { hydrateRoutesCache } from '../services/routesCache';
import { queryClient } from '../api/queryClient';
import { registerPushNotifications } from '../services/pushNotifications';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';
import { AuthStackParamList } from '../types/navigation';

// Password-reset emails link to trailquest://reset-password?token=... — this
// only resolves against AuthNavigator's screens (the logged-out stack), so a
// stale link tapped while already signed in is silently ignored, which is
// the intended behavior (a signed-in user changes password from Settings).
const linking: LinkingOptions<AuthStackParamList> = {
  prefixes: ['trailquest://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
    },
  },
};

export function RootNavigator(): React.ReactElement {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const theme = useThemeColors();
  const isDark = useIsDark();

  const navTheme: Theme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme : DefaultTheme).colors,
        primary: theme.primary,
        background: theme.background,
        card: theme.surface,
        text: theme.text,
        border: theme.border,
        notification: theme.accent,
      },
    }),
    [theme, isDark],
  );

  useEffect(() => {
    initMapbox();
    void hydrateLocale();
    void hydrateTheme();
    void hydrate();
    // Seed the Explore list from disk so a cold offline launch isn't empty.
    void hydrateRoutesCache(queryClient);
  }, [hydrate, hydrateLocale, hydrateTheme]);

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

  // Ask for notification permission + register the FCM token once signed
  // in. Re-runs on every sign-in (not just first launch) so a token that
  // rotated while logged out — or a second account on this device — still
  // gets registered.
  useEffect(() => {
    if (status === 'authenticated') void registerPushNotifications();
  }, [status]);

  const statusBar = (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={theme.background}
    />
  );

  if (status === 'loading') {
    return (
      <View style={[styles.splash, { backgroundColor: theme.background }]}>
        {statusBar}
        <Loader message="TrailQuest" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      {statusBar}
      {status === 'authenticated' ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1 },
});
