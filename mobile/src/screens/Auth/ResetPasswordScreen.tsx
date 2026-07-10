import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthShell } from './AuthShell';
import { AppText, Banner, Button, TextField } from '../../components/ui';
import { spacing, useThemeColors } from '../../theme';
import { resetPasswordRequest } from '../../api/auth.api';
import { getApiErrorMessage } from '../../api/client';
import { validatePassword } from '../../utils/validation';
import { useT } from '../../i18n';
import { AuthScreenProps } from '../../types/navigation';

export function ResetPasswordScreen({
  navigation,
  route,
}: AuthScreenProps<'ResetPassword'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const token = route.params?.token;

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    const passErr = validatePassword(password, 8, t);
    setError(passErr ?? undefined);
    if (passErr) return;
    if (!token) {
      setFormError(t('auth.resetLinkInvalid'));
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
    } catch (err) {
      setFormError(getApiErrorMessage(err, t('auth.resetFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.resetTitle')}
      subtitle={done ? t('auth.resetDoneSubtitle') : t('auth.resetSubtitle')}
    >
      {formError ? (
        <Banner tone="error" message={formError} style={styles.banner} />
      ) : null}
      {!token && !formError ? (
        <Banner tone="warning" message={t('auth.resetLinkInvalid')} style={styles.banner} />
      ) : null}

      {done ? (
        <Button
          label={t('auth.backToSignIn')}
          onPress={() => navigation.navigate('Login')}
          style={styles.submit}
        />
      ) : (
        <>
          <TextField
            label={t('auth.resetNewPassword')}
            icon="lock-outline"
            placeholder={t('auth.passwordPlaceholderMin')}
            secure
            value={password}
            onChangeText={setPassword}
            error={error}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
          <Button
            label={t('auth.resetSubmit')}
            onPress={onSubmit}
            loading={submitting}
            disabled={!token}
            style={styles.submit}
          />
        </>
      )}

      <View style={styles.footer}>
        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <AppText variant="bodyStrong" color={theme.primary}>
            {t('auth.backToSignIn')}
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
