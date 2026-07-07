import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
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
  }, [hydrate, hydrateLocale]);

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
