import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Button } from './ui';
import { colors, shadow, spacing, useThemeColors } from '../theme';
import { AVATAR_COLORS, AVATAR_ICONS, makeAvatarId, parseAvatarId } from './avatars';
import { useT } from '../i18n';

interface AvatarPickerProps {
  visible: boolean;
  /** Currently stored avatar id, used to preselect icon and color. */
  current?: string | null;
  saving?: boolean;
  onClose: () => void;
  /** Called with the chosen avatar id, or null to reset to initials. */
  onSave: (avatarId: string | null) => void;
}

/** Bottom-sheet picker for the preset icon-on-disc avatars. */
export function AvatarPicker({
  visible,
  current,
  saving,
  onClose,
  onSave,
}: AvatarPickerProps): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const [icon, setIcon] = useState<string>(AVATAR_ICONS[0]);
  const [colorIndex, setColorIndex] = useState(0);

  // Re-sync the selection with the stored avatar each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    const spec = parseAvatarId(current);
    if (spec) {
      setIcon(spec.icon);
      setColorIndex(Math.max(0, AVATAR_COLORS.findIndex((c) => c.bg === spec.bg)));
    }
  }, [visible, current]);

  const color = AVATAR_COLORS[colorIndex] ?? AVATAR_COLORS[0];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={[styles.grabber, { backgroundColor: theme.border }]} />
        <AppText variant="subheading" style={styles.title}>
          {t('avatar.title')}
        </AppText>

        <View style={styles.preview}>
          <View style={[styles.previewDisc, { backgroundColor: color.bg }]}>
            <Icon name={icon} size={46} color={color.fg} />
          </View>
        </View>

        <View style={styles.colorRow}>
          {AVATAR_COLORS.map((c, i) => (
            <Pressable
              key={c.bg}
              onPress={() => setColorIndex(i)}
              hitSlop={6}
              style={[
                styles.colorDot,
                { backgroundColor: c.fg },
                i === colorIndex ? { borderColor: theme.text, transform: [{ scale: 1.15 }] } : null,
              ]}
            />
          ))}
        </View>

        <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {AVATAR_ICONS.map((name) => {
              const selected = name === icon;
              return (
                <Pressable
                  key={name}
                  onPress={() => setIcon(name)}
                  style={[
                    styles.cell,
                    { backgroundColor: selected ? color.bg : colors.surface },
                    selected ? { borderColor: color.fg } : null,
                  ]}
                >
                  <Icon
                    name={name}
                    size={28}
                    color={selected ? color.fg : colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {parseAvatarId(current) ? (
            <Button
              label={t('avatar.reset')}
              variant="secondary"
              onPress={() => onSave(null)}
              disabled={saving}
              style={styles.footerButton}
            />
          ) : null}
          <Button
            label={t('avatar.save')}
            onPress={() => onSave(makeAvatarId(icon, colorIndex))}
            loading={saving}
            style={styles.footerButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(20, 26, 24, 0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    maxHeight: '82%',
    ...shadow.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  title: { textAlign: 'center', marginTop: spacing.lg },
  preview: { alignItems: 'center', marginTop: spacing.lg },
  previewDisc: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: colors.text,
    transform: [{ scale: 1.15 }],
  },
  gridScroll: { marginTop: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  cell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  footerButton: { flex: 1 },
});
