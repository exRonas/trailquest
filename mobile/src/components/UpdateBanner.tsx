import React from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner } from './ui';
import { spacing } from '../theme';
import { useT } from '../i18n';
import { useAppVersion } from '../api/hooks/useAppVersion';
import { CURRENT_VERSION_CODE } from '../config/appVersion';

export function UpdateBanner(): React.ReactElement | null {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { data } = useAppVersion();

  if (!data || data.latestVersionCode <= CURRENT_VERSION_CODE) return null;

  return (
    <Pressable
      onPress={() => Linking.openURL(data.downloadUrl)}
      style={[styles.wrap, { top: insets.top + spacing.sm }]}
    >
      <Banner tone="info" message={`${t('update.available')} — ${t('update.message')} ${t('update.action')}`} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
  },
});
