import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Button } from './ui';
import { colors, radius, shadow, spacing, useThemeColors } from '../theme';
import { checkpointIcon } from '../theme/icons';
import { useT, usePickLocalized } from '../i18n';
import { ScanResult } from '../types/api';

interface ScanResultCardProps {
  result: ScanResult | null;
  visible: boolean;
  onClose: () => void;
}

/**
 * Celebratory card shown after scanning a checkpoint QR. Mirrors the run-summary
 * overlay's "photo card" feel but with its own layout: an optional hero image,
 * the checkpoint's localized name/description, the XP gained (incl. the
 * all-checkpoints route bonus), and live checkpoint progress.
 */
export function ScanResultCard({
  result,
  visible,
  onClose,
}: ScanResultCardProps): React.ReactElement | null {
  const t = useT();
  const theme = useThemeColors();
  const pickLocalized = usePickLocalized();
  if (!result) return null;

  const { checkpoint } = result;
  const c = colors.checkpoint[checkpoint.type];
  const hasImage = !!checkpoint.mediaUrl;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Pressable style={[styles.closeBtn, { backgroundColor: theme.surface }]} onPress={onClose} hitSlop={10}>
            <Icon name="close" size={22} color={colors.textSecondary} />
          </Pressable>

          {/* Hero: checkpoint image if available, else a coloured icon band */}
          {hasImage ? (
            <Image source={{ uri: checkpoint.mediaUrl! }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroFallback, { backgroundColor: c.soft }]}>
              <Icon name={checkpointIcon[checkpoint.type]} size={46} color={c.main} />
            </View>
          )}

          <View style={[styles.scanBadge, { backgroundColor: c.main }]}>
            <Icon
              name={result.pending ? 'cloud-upload-outline' : 'qrcode-scan'}
              size={16}
              color={colors.textInverse}
            />
            <AppText variant="overline" color={colors.textInverse} style={styles.scanBadgeText}>
              {result.pending
                ? t('scan.pendingTitle')
                : result.alreadyScanned
                  ? t('scan.alreadyTitle')
                  : t('scan.title')}
            </AppText>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            <AppText variant="title" style={styles.name}>
              {pickLocalized(checkpoint.name)}
            </AppText>

            {pickLocalized(checkpoint.description) ? (
              <AppText variant="body" color={colors.textSecondary} style={styles.desc}>
                {pickLocalized(checkpoint.description)}
              </AppText>
            ) : null}

            {/* XP */}
            {result.pending ? (
              <AppText variant="callout" color={colors.textMuted} style={styles.alreadyNote}>
                {t('scan.pendingNote')}
              </AppText>
            ) : !result.alreadyScanned ? (
              <View style={styles.xpRow}>
                <View style={styles.xpPill}>
                  <Icon name="star-four-points" size={16} color={colors.accent} />
                  <AppText variant="bodyStrong" color={colors.accent} style={styles.xpText}>
                    {t('scan.xpGained', { xp: result.xpAwarded })}
                  </AppText>
                </View>
              </View>
            ) : (
              <AppText variant="callout" color={colors.textMuted} style={styles.alreadyNote}>
                {t('scan.alreadyNote')}
              </AppText>
            )}

            {!result.pending && result.bonusAwarded > 0 ? (
              <AppText variant="callout" color={colors.success} style={styles.bonus}>
                🎉 {t('scan.routeBonus', { bonus: result.bonusAwarded })}
              </AppText>
            ) : null}

            {/* Progress + rank */}
            <View style={[styles.statsRow, { backgroundColor: theme.surfaceAlt }]}>
              <Stat
                icon="flag-checkered"
                label={t('scan.checkpoints')}
                value={`${result.reachedCount}/${result.totalCheckpoints}`}
              />
              {!result.pending ? (
                <>
                  <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                  <Stat
                    icon="medal-outline"
                    label={pickLocalized(result.country)}
                    value={`${t('scan.level')} ${result.level.level} · ${pickLocalized(
                      result.level.rank,
                    )}`}
                  />
                </>
              ) : null}
            </View>
          </ScrollView>

          <View style={[styles.actions, { borderTopColor: theme.border }]}>
            <Button label={t('scan.gotIt')} onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}): React.ReactElement {
  const theme = useThemeColors();
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={18} color={theme.primary} />
      <AppText variant="bodyStrong" style={styles.statValue} numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
        {label}
      </AppText>
    </View>
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
    maxHeight: '88%',
    ...shadow.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { width: '100%', height: 170 },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: -14,
    marginLeft: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scanBadgeText: { marginLeft: 6 },
  body: { paddingHorizontal: spacing.lg },
  bodyContent: { paddingTop: spacing.md, paddingBottom: spacing.md },
  name: { marginBottom: spacing.xs },
  desc: { marginTop: spacing.sm },
  xpRow: { flexDirection: 'row', marginTop: spacing.lg },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
  },
  xpText: { marginLeft: 6 },
  alreadyNote: { marginTop: spacing.lg },
  bonus: { marginTop: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  statValue: { marginTop: 4, textAlign: 'center' },
  actions: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
