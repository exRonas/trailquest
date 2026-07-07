import React from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Button } from './ui';
import { colors, radius, spacing } from '../theme';
import { checkpointIcon } from '../theme/icons';
import { labelForCheckpointType } from '../utils/format';
import { usePickLocalized } from '../i18n';
import { Checkpoint } from '../types/api';

interface CheckpointModalProps {
  checkpoint: Checkpoint | null;
  visible: boolean;
  /** True when surfaced by an automatic geo-trigger (vs manual tap). */
  triggered?: boolean;
  onClose: () => void;
}

/**
 * Checkpoint detail sheet. Visual treatment varies by checkpoint type — DANGER
 * is loud and red, HISTORICAL is calm and scholarly, etc.
 */
export function CheckpointModal({
  checkpoint,
  visible,
  triggered = false,
  onClose,
}: CheckpointModalProps): React.ReactElement | null {
  const pickLocalized = usePickLocalized();
  if (!checkpoint) return null;
  const c = colors.checkpoint[checkpoint.type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.banner, { backgroundColor: c.main }]}>
            <View style={styles.bannerIcon}>
              <Icon name={checkpointIcon[checkpoint.type]} size={26} color={c.main} />
            </View>
            <View style={styles.bannerText}>
              <AppText variant="overline" color={colors.textInverse}>
                {triggered ? 'Checkpoint reached' : labelForCheckpointType(checkpoint.type)}
              </AppText>
              <AppText variant="heading" color={colors.textInverse} numberOfLines={2}>
                {pickLocalized(checkpoint.name)}
              </AppText>
            </View>
          </View>

          <View style={styles.body}>
            {checkpoint.mediaUrl ? (
              <Image source={{ uri: checkpoint.mediaUrl }} style={styles.media} />
            ) : null}
            <AppText variant="body" color={colors.text}>
              {pickLocalized(checkpoint.description)}
            </AppText>

            {checkpoint.altitudeM != null ? (
              <View style={styles.metaRow}>
                <Icon name="elevation-rise" size={15} color={colors.textMuted} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.meta}>
                  {Math.round(checkpoint.altitudeM)} m elevation
                </AppText>
              </View>
            ) : null}

            <Button
              label="Got it"
              onPress={onClose}
              variant={checkpoint.type === 'DANGER' ? 'danger' : 'primary'}
              style={styles.action}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bannerText: { flex: 1 },
  body: { padding: spacing.lg },
  media: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  meta: { marginLeft: 4 },
  action: { marginTop: spacing.xl },
});
