import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './ui';
import { colors, radius, spacing, useThemeColors } from '../theme';
import { useT } from '../i18n';
import { pendingCount, syncAll } from '../services/offlineQueue';

/** Shown on Profile when there are route sessions recorded with no
 *  connection (see offlineQueue.ts) still waiting to reach the server. */
export function PendingSyncBanner(): React.ReactElement | null {
  const t = useT();
  const theme = useThemeColors();
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    void pendingCount().then(setCount);
  }, []);

  useFocusEffect(refresh);

  const onSyncNow = async () => {
    setSyncing(true);
    await syncAll();
    setSyncing(false);
    refresh();
  };

  if (count === 0) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface }]}>
      <Icon name="cloud-sync-outline" size={20} color={theme.primary} />
      <AppText variant="callout" style={styles.text}>
        {t('sync.pending', { count })}
      </AppText>
      <Pressable onPress={onSyncNow} disabled={syncing} hitSlop={8}>
        {syncing ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <AppText variant="bodyStrong" color={theme.primary}>
            {t('sync.now')}
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  text: { flex: 1, marginLeft: spacing.sm },
});
