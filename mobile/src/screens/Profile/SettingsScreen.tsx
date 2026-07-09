import React, { useEffect, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Chip, TextField } from '../../components/ui';
import { TopoPattern } from '../../components/decor';
import {
  spacing,
  useDesignStore,
  useThemeColors,
  useThemeStore,
  DESIGN_VERSIONS,
  THEME_MODES,
} from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useUpdateName, useChangePassword } from '../../api/hooks/useUsers';
import { getApiErrorMessage } from '../../api/client';
import { validateName, validatePassword } from '../../utils/validation';
import { useT } from '../../i18n';
import { ProfileScreenProps } from '../../types/navigation';

const THEME_LABEL_KEY: Record<string, string> = {
  system: 'settings.themeSystem',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
};

const THEME_ICON: Record<string, string> = {
  system: 'theme-light-dark',
  light: 'white-balance-sunny',
  dark: 'moon-waning-crescent',
};

const DESIGN_LABEL_KEY: Record<string, string> = {
  v1: 'settings.designV1',
  v2: 'settings.designV2',
  v3: 'settings.designV3',
};

const DESIGN_ICON: Record<string, string> = {
  v1: 'pine-tree',
  v2: 'image-filter-hdr',
  v3: 'compass-rose',
};

export function SettingsScreen({
  navigation,
}: ProfileScreenProps<'Settings'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const designVersion = useDesignStore((s) => s.version);
  const setDesignVersion = useDesignStore((s) => s.setVersion);
  const updateName = useUpdateName();
  const changePassword = useChangePassword();

  useEffect(() => {
    navigation.setOptions({ title: t('settings.title') });
  }, [navigation, t]);

  const [name, setName] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameStatus, setNameStatus] = useState<string | null>(null);

  const onSaveName = () => {
    const err = validateName(name, t);
    setNameError(err);
    setNameStatus(null);
    if (err) return;
    Keyboard.dismiss();
    updateName.mutate(name.trim(), {
      // Shown inline instead of Alert.alert — a native dialog popping up
      // right before the user taps back triggers an Android native-stack
      // bug that leaves Profile's buttons permanently unresponsive
      // (confirmed: only reproduces on name/password save, which alert;
      // theme change, which doesn't alert, never breaks it).
      onSuccess: () => setNameStatus(t('settings.nameSaved')),
      onError: (e) => setNameStatus(getApiErrorMessage(e, t('settings.nameSaveFailed'))),
    });
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{
    current?: string;
    next?: string;
    confirm?: string;
  }>({});
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const onChangePassword = () => {
    const currentErr = currentPassword
      ? null
      : t('validation.passwordRequired');
    const nextErr = validatePassword(newPassword, 8, t);
    const confirmErr =
      newPassword !== confirmPassword ? t('settings.passwordMismatch') : null;
    setPasswordErrors({
      current: currentErr ?? undefined,
      next: nextErr ?? undefined,
      confirm: confirmErr ?? undefined,
    });
    setPasswordStatus(null);
    if (currentErr || nextErr || confirmErr) return;

    Keyboard.dismiss();
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordStatus(t('settings.passwordUpdated'));
        },
        onError: (e) => {
          setPasswordStatus(getApiErrorMessage(e, t('settings.passwordSaveFailed')));
        },
      },
    );
  };

  const atlas = designVersion === 'v3';
  // Section header: in Atlas gets a short dashed rust underline, like a
  // heading in a field ledger.
  const sectionHeader = (label: string) => (
    <View style={styles.sectionHeader}>
      <AppText variant="overline" color={theme.textMuted}>
        {label}
      </AppText>
      {atlas ? <View style={[styles.atlasUnderline, { borderColor: theme.accent }]} /> : null}
    </View>
  );
  const atlasCardStyle = atlas
    ? [styles.card, styles.atlasCard, { borderColor: theme.border }]
    : styles.card;

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {sectionHeader(t('settings.appearance'))}
      <Card style={atlasCardStyle}>
        {atlas ? <TopoPattern color={theme.primary} opacity={0.08} /> : null}
        <AppText variant="label" color={theme.textSecondary} style={styles.fieldLabel}>
          {t('settings.theme')}
        </AppText>
        <View style={styles.themeRow}>
          {THEME_MODES.map((m) => (
            <Chip
              key={m}
              label={t(THEME_LABEL_KEY[m])}
              icon={THEME_ICON[m]}
              selected={themeMode === m}
              onPress={() => setThemeMode(m)}
            />
          ))}
        </View>
        <AppText
          variant="label"
          color={theme.textSecondary}
          style={[styles.fieldLabel, styles.designLabel]}
        >
          {t('settings.design')}
        </AppText>
        <View style={styles.themeRow}>
          {DESIGN_VERSIONS.map((v) => (
            <Chip
              key={v}
              label={t(DESIGN_LABEL_KEY[v])}
              icon={DESIGN_ICON[v]}
              selected={designVersion === v}
              onPress={() => setDesignVersion(v)}
            />
          ))}
        </View>
      </Card>

      {sectionHeader(t('settings.profileSection'))}
      <Card style={atlasCardStyle}>
        <TextField
          label={t('settings.name')}
          icon="account-outline"
          placeholder={t('settings.namePlaceholder')}
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
          error={nameError}
        />
        <Button
          label={t('settings.saveName')}
          onPress={onSaveName}
          loading={updateName.isPending}
        />
        {nameStatus ? (
          <AppText
            variant="caption"
            color={updateName.isError ? theme.danger : theme.success}
            style={styles.statusText}
          >
            {nameStatus}
          </AppText>
        ) : null}
      </Card>

      {sectionHeader(t('settings.passwordSection'))}
      <Card style={atlasCardStyle}>
        <TextField
          label={t('settings.currentPassword')}
          icon="lock-outline"
          secure
          value={currentPassword}
          onChangeText={setCurrentPassword}
          error={passwordErrors.current}
        />
        <TextField
          label={t('settings.newPassword')}
          icon="lock-plus-outline"
          secure
          value={newPassword}
          onChangeText={setNewPassword}
          error={passwordErrors.next}
        />
        <TextField
          label={t('settings.confirmPassword')}
          icon="lock-check-outline"
          secure
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={passwordErrors.confirm}
          onSubmitEditing={onChangePassword}
          returnKeyType="done"
        />
        <Button
          label={t('settings.changePassword')}
          onPress={onChangePassword}
          loading={changePassword.isPending}
        />
        {passwordStatus ? (
          <AppText
            variant="caption"
            color={changePassword.isError ? theme.danger : theme.success}
            style={styles.statusText}
          >
            {passwordStatus}
          </AppText>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
  sectionHeader: { marginBottom: spacing.sm, marginTop: spacing.lg },
  atlasUnderline: {
    width: 42,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    marginTop: 3,
  },
  card: { marginBottom: spacing.lg },
  atlasCard: {
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  fieldLabel: { marginBottom: spacing.sm },
  statusText: { marginTop: spacing.sm, textAlign: 'center' },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  designLabel: { marginTop: spacing.md },
});
