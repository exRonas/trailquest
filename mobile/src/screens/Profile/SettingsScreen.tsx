import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { AppText, Button, Card, TextField } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useUpdateName, useChangePassword } from '../../api/hooks/useUsers';
import { getApiErrorMessage } from '../../api/client';
import { validateName, validatePassword } from '../../utils/validation';
import { useT } from '../../i18n';
import { ProfileScreenProps } from '../../types/navigation';

export function SettingsScreen({
  navigation,
}: ProfileScreenProps<'Settings'>): React.ReactElement {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const updateName = useUpdateName();
  const changePassword = useChangePassword();

  useEffect(() => {
    navigation.setOptions({ title: t('settings.title') });
  }, [navigation, t]);

  const [name, setName] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);

  const onSaveName = () => {
    const err = validateName(name, t);
    setNameError(err);
    if (err) return;
    updateName.mutate(name.trim(), {
      onSuccess: () => Alert.alert(t('settings.nameSaved')),
      onError: (e) =>
        Alert.alert(t('settings.nameSaveFailed'), getApiErrorMessage(e)),
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
    if (currentErr || nextErr || confirmErr) return;

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          Alert.alert(t('settings.passwordUpdated'));
        },
        onError: (e) => {
          const message = getApiErrorMessage(e, t('settings.passwordSaveFailed'));
          Alert.alert(t('settings.passwordSaveFailed'), message);
        },
      },
    );
  };

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="overline" color={colors.textMuted} style={styles.sectionTitle}>
        {t('settings.profileSection')}
      </AppText>
      <Card style={styles.card}>
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
      </Card>

      <AppText variant="overline" color={colors.textMuted} style={styles.sectionTitle}>
        {t('settings.passwordSection')}
      </AppText>
      <Card style={styles.card}>
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
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.lg },
  card: { marginBottom: spacing.lg },
});
