import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthShell } from './AuthShell';
import { AppText, Banner, Button, TextField } from '../../components/ui';
import { colors, spacing, useThemeColors } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../api/client';
import {
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validation';
import { useT } from '../../i18n';
import { AuthScreenProps } from '../../types/navigation';

export function RegisterScreen({
  navigation,
}: AuthScreenProps<'Register'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const nameErr = validateName(name, t);
    const emailErr = validateEmail(email, t);
    const passErr = validatePassword(password, 8, t);
    setErrors({
      name: nameErr ?? undefined,
      email: emailErr ?? undefined,
      password: passErr ?? undefined,
    });
    if (nameErr || emailErr || passErr) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
    } catch (err) {
      setFormError(getApiErrorMessage(err, t('auth.registerFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      {formError ? (
        <Banner tone="error" message={formError} style={styles.banner} />
      ) : null}

      <TextField
        label={t('auth.name')}
        icon="account-outline"
        placeholder={t('auth.namePlaceholder')}
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />
      <TextField
        label={t('auth.email')}
        icon="email-outline"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <TextField
        label={t('auth.password')}
        icon="lock-outline"
        placeholder={t('auth.passwordPlaceholderMin')}
        secure
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
      />

      <Button
        label={t('auth.createAccount')}
        onPress={onSubmit}
        loading={submitting}
        style={styles.submit}
      />

      <View style={styles.footer}>
        <AppText variant="callout" color={colors.textSecondary}>
          {t('auth.haveAccount')}
        </AppText>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <AppText variant="bodyStrong" color={theme.primary}>
            {t('auth.signIn')}
          </AppText>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  banner: { marginBottom: spacing.lg },
  submit: { marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
