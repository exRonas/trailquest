import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthShell } from './AuthShell';
import { AppText, Banner, Button, TextField } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../api/client';
import { validateEmail, validatePassword } from '../../utils/validation';
import { useT } from '../../i18n';
import { AuthScreenProps } from '../../types/navigation';

export function LoginScreen({
  navigation,
}: AuthScreenProps<'Login'>): React.ReactElement {
  const t = useT();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('email@email.com');
  const [password, setPassword] = useState('123');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const emailErr = validateEmail(email, t);
    const passErr = validatePassword(password, 1, t);
    setErrors({ email: emailErr ?? undefined, password: passErr ?? undefined });
    if (emailErr || passErr) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // On success the root navigator swaps to the main tabs automatically.
    } catch (err) {
      setFormError(getApiErrorMessage(err, t('auth.signInFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      {formError ? (
        <Banner tone="error" message={formError} style={styles.banner} />
      ) : null}

      <TextField
        label={t('auth.email')}
        icon="email-outline"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        returnKeyType="next"
      />
      <TextField
        label={t('auth.password')}
        icon="lock-outline"
        placeholder={t('auth.passwordPlaceholder')}
        secure
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      <Button
        label={t('auth.signIn')}
        onPress={onSubmit}
        loading={submitting}
        style={styles.submit}
      />

      <View style={styles.footer}>
        <AppText variant="callout" color={colors.textSecondary}>
          {t('auth.noAccount')}
        </AppText>
        <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
          <AppText variant="bodyStrong" color={colors.primary}>
            {t('auth.createAccount')}
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
