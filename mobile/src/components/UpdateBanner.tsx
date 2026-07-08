import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './ui';
import { spacing, useThemeColors } from '../theme';
import { useT } from '../i18n';
import { useUpdateAvailable } from '../api/hooks/useAppVersion';

/**
 * In-flow "update available" row for the top of Profile. Dismissible (X) —
 * once closed, it stays hidden for that version (see useUpdateAvailable) and
 * reappears only when an even newer version ships.
 *
 * This deliberately does NOT float over the header/tab bar (an earlier
 * version did, positioned at `insets.top`, which sat exactly where the native
 * header lives and silently blocked taps on header buttons like Settings —
 * a real bug, not just a cosmetic overlap). Living in-flow inside Profile's
 * content means it can never block anything.
 */
export function UpdateBanner(): React.ReactElement | null {
  const t = useT();
  const theme = useThemeColors();
  const { data, available, dismissed, dismiss } = useUpdateAvailable();

  if (!data || !available || dismissed) return null;

  return (
    <Pressable
      style={[styles.row, { backgroundColor: theme.infoSoft }]}
      onPress={() => Linking.openURL(data.downloadUrl)}
    >
      <Icon name="cloud-download-outline" size={20} color={theme.info} />
      <View style={styles.rowText}>
        <AppText variant="bodyStrong" color={theme.info}>
          {t('update.available')}
        </AppText>
        <AppText variant="caption" color={theme.textSecondary}>
          {t('update.message')}
        </AppText>
      </View>
      <Pressable onPress={dismiss} hitSlop={10} style={styles.closeBtn}>
        <Icon name="close" size={18} color={theme.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  rowText: { flex: 1, marginLeft: spacing.md },
  closeBtn: { padding: spacing.xs, marginLeft: spacing.sm },
});
