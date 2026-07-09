import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Button } from './ui';
import { shadow, spacing, useThemeColors } from '../theme';
import { AVATAR_ICONS, makeAvatarId, parseAvatarId } from './avatars';
import { useT } from '../i18n';

interface AvatarPickerProps {
  visible: boolean;
  /** Currently stored avatar id, used to preselect the icon. */
  current?: string | null;
  saving?: boolean;
  onClose: () => void;
  /** Called with the chosen avatar id, or null to reset to initials. */
  onSave: (avatarId: string | null) => void;
}

// The avatar id format is "<icon>-<colorIndex>", kept for backend
// compatibility, but the color is no longer user-chosen — avatars always
// render in the app's current theme accent (see Avatar.tsx), so this index
// is just a fixed placeholder now.
const FIXED_COLOR_INDEX = 0;

/** Bottom-sheet picker for the preset icon avatars (shape only — color
 *  always follows the current theme accent). */
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

  // Re-sync the selection with the stored avatar each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    const spec = parseAvatarId(current);
    if (spec) setIcon(spec.icon);
  }, [visible, current]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* RN's Modal mounts into its own native root, outside the app's
          GestureHandlerRootView — without wrapping it here, gesture-handler
          Pressables (used by Button) inside this sheet silently never fire. */}
      <GestureHandlerRootView style={styles.fill}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={[styles.grabber, { backgroundColor: theme.border }]} />
          <AppText variant="subheading" style={styles.title}>
            {t('avatar.title')}
          </AppText>

          <View style={styles.preview}>
            <View style={[styles.previewDisc, { backgroundColor: theme.primarySoft }]}>
              <Icon name={icon} size={46} color={theme.primary} />
            </View>
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
                      { backgroundColor: selected ? theme.primarySoft : theme.surface },
                      selected ? { borderColor: theme.primary } : null,
                    ]}
                  >
                    <Icon
                      name={name}
                      size={28}
                      color={selected ? theme.primary : theme.textSecondary}
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
              onPress={() => onSave(makeAvatarId(icon, FIXED_COLOR_INDEX))}
              loading={saving}
              style={styles.footerButton}
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: {
    backgroundColor: 'rgba(20, 26, 24, 0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
