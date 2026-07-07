import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, ProgressBar } from './ui';
import { colors, radius, spacing } from '../theme';
import { useT } from '../i18n';
import {
  deleteOfflineMap,
  downloadOfflineMap,
  getOfflineMapStatus,
} from '../services/offlineMaps';

type Coord = [number, number];

interface OfflineMapCardProps {
  routeId: string;
  coords: Coord[];
}

type State =
  | { kind: 'checking' }
  | { kind: 'none' }
  | { kind: 'downloading'; percentage: number }
  | { kind: 'ready' }
  | { kind: 'error'; message: string };

/** Lets the user pre-download map tiles for a route so it still renders with
 *  no signal on the trail (GPS/checkpoints already work offline regardless —
 *  this is purely the visual map). */
export function OfflineMapCard({ routeId, coords }: OfflineMapCardProps): React.ReactElement {
  const t = useT();
  const [state, setState] = useState<State>({ kind: 'checking' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const status = await getOfflineMapStatus(routeId);
      if (cancelled) return;
      setState(status?.complete ? { kind: 'ready' } : { kind: 'none' });
    })();
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  const onDownload = useCallback(async () => {
    setState({ kind: 'downloading', percentage: 0 });
    try {
      await downloadOfflineMap(routeId, coords, (percentage) =>
        setState({ kind: 'downloading', percentage }),
      );
      setState({ kind: 'ready' });
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : t('route.offlineFailed'),
      });
    }
  }, [routeId, coords, t]);

  const onDelete = useCallback(() => {
    Alert.alert(t('route.offlineDeleteTitle'), t('route.offlineDeleteMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteOfflineMap(routeId);
          setState({ kind: 'none' });
        },
      },
    ]);
  }, [routeId, t]);

  if (state.kind === 'checking') return <View style={styles.card} />;

  return (
    <View style={styles.card}>
      {state.kind === 'none' ? (
        <Pressable style={styles.row} onPress={onDownload}>
          <Icon name="cloud-download-outline" size={22} color={colors.primary} />
          <AppText variant="bodyStrong" style={styles.text}>
            {t('route.offlineDownload')}
          </AppText>
        </Pressable>
      ) : null}

      {state.kind === 'downloading' ? (
        <View>
          <View style={styles.row}>
            <Icon name="cloud-download-outline" size={22} color={colors.primary} />
            <AppText variant="bodyStrong" style={styles.text}>
              {t('route.offlineDownloading', { percent: Math.round(state.percentage) })}
            </AppText>
          </View>
          <ProgressBar value={state.percentage / 100} style={styles.progress} />
        </View>
      ) : null}

      {state.kind === 'ready' ? (
        <View style={styles.row}>
          <Icon name="check-circle-outline" size={22} color={colors.success} />
          <AppText variant="bodyStrong" color={colors.success} style={styles.text}>
            {t('route.offlineReady')}
          </AppText>
          <Pressable onPress={onDelete} hitSlop={8}>
            <AppText variant="callout" color={colors.danger}>
              {t('common.delete')}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {state.kind === 'error' ? (
        <View>
          <View style={styles.row}>
            <Icon name="alert-circle-outline" size={22} color={colors.danger} />
            <AppText variant="callout" color={colors.danger} style={styles.text}>
              {state.message}
            </AppText>
          </View>
          <Pressable onPress={onDownload}>
            <AppText variant="bodyStrong" color={colors.primary}>
              {t('common.retry')}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1, marginLeft: spacing.sm },
  progress: { marginTop: spacing.sm },
});
