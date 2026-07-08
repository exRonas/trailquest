import React, { useRef } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Button } from './ui';
import { StatTile } from './StatTile';
import { TrackMap } from './map/TrackMap';
import { ShareableStatsCard } from './ShareableStatsCard';
import { shareViewAsImage } from '../services/shareCard';
import { colors, radius, shadow, spacing } from '../theme';
import {
  formatClock,
  formatDistanceKm,
  formatSpeed,
} from '../utils/format';
import { useT } from '../i18n';

interface LatLng {
  lat: number;
  lng: number;
}

interface RunSummaryOverlayProps {
  visible: boolean;
  routeTitle: string;
  distanceKm: number;
  movingSeconds: number;
  reachedCount: number;
  totalCheckpoints: number;
  track: LatLng[];
  saving?: boolean;
  onClose: () => void;
  onSave: () => void;
}

/**
 * A photo-card style overlay shown when a route is finished: a snapshot of the
 * recorded track plus headline stats, with share / save actions. It floats over
 * the navigation screen rather than replacing it.
 */
export function RunSummaryOverlay({
  visible,
  routeTitle,
  distanceKm,
  movingSeconds,
  reachedCount,
  totalCheckpoints,
  track,
  saving = false,
  onClose,
  onSave,
}: RunSummaryOverlayProps): React.ReactElement {
  const t = useT();
  const shareRef = useRef<View>(null);
  const avgSpeed =
    movingSeconds > 0 ? distanceKm / (movingSeconds / 3600) : 0;

  const onShare = () => {
    void shareViewAsImage(
      shareRef,
      t('summary.shareMessage', {
        title: routeTitle,
        distance: formatDistanceKm(distanceKm),
        time: formatClock(movingSeconds),
      }),
    );
  };

  const shareStats = [
    { icon: 'map-marker-distance', value: formatDistanceKm(distanceKm), label: t('summary.distance') },
    { icon: 'timer-outline', value: formatClock(movingSeconds), label: t('summary.time') },
    { icon: 'speedometer', value: formatSpeed(avgSpeed), label: t('summary.avgSpeed') },
    { icon: 'flag-variant-outline', value: `${reachedCount}/${totalCheckpoints}`, label: t('summary.checkpoints') },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <Icon name="close" size={22} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.trophy}>
            <Icon name="trophy" size={30} color={colors.accent} />
          </View>
          <AppText variant="title" style={styles.title}>
            {t('summary.title')}
          </AppText>
          <AppText
            variant="callout"
            color={colors.textSecondary}
            style={styles.subtitle}
          >
            {routeTitle}
          </AppText>

          <View style={styles.mapWrap}>
            <TrackMap track={track} height={170} />
          </View>

          <View style={styles.statsRow}>
            <StatTile
              icon="map-marker-distance"
              value={formatDistanceKm(distanceKm)}
              label={t('summary.distance')}
              emphasis
            />
            <View style={styles.divider} />
            <StatTile
              icon="timer-outline"
              value={formatClock(movingSeconds)}
              label={t('summary.time')}
              emphasis
            />
          </View>
          <View style={styles.statsRow}>
            <StatTile
              icon="speedometer"
              value={formatSpeed(avgSpeed)}
              label={t('summary.avgSpeed')}
              emphasis
            />
            <View style={styles.divider} />
            <StatTile
              icon="flag-variant-outline"
              value={`${reachedCount}/${totalCheckpoints}`}
              label={t('summary.checkpoints')}
              emphasis
            />
          </View>

          <View style={styles.actions}>
            <Button
              label={t('summary.share')}
              icon="share-variant"
              variant="secondary"
              onPress={onShare}
              style={styles.actionBtn}
            />
            <Button
              label={t('summary.save')}
              icon="check"
              onPress={onSave}
              loading={saving}
              style={styles.actionBtn}
            />
          </View>
        </View>

        {/* Off-screen card captured for image sharing. */}
        <View style={styles.offscreen} pointerEvents="none">
          <ShareableStatsCard ref={shareRef} title={routeTitle} stats={shareStats} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    padding: spacing.xs,
  },
  trophy: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: spacing.xs },
  mapWrap: { marginTop: spacing.lg },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: colors.border,
  },
  actions: { marginTop: spacing.xl },
  actionBtn: { marginBottom: spacing.sm },
  offscreen: { position: 'absolute', left: -9999, top: 0 },
});
