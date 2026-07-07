import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  Theme,
} from '@react-navigation/native';
import { Loader } from '../components/ui';
import { UpdateBanner } from '../components/UpdateBanner';
import { colors } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useLocaleStore } from '../i18n';
import { initMapbox } from '../services/mapbox';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export function RootNavigator(): React.ReactElement {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);

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
