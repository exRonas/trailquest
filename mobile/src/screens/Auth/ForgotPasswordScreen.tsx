import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthShell } from './AuthShell';
import { AppText, Banner, Button, TextField } from '../../components/ui';
import { spacing, useThemeColors } from '../../theme';
import { forgotPasswordRequest } from '../../api/auth.api';
import { getApiErrorMessage } from '../../api/client';
import { validateEmail } from '../../utils/validation';
import { useT } from '../../i18n';
import { AuthScreenProps } from '../../types/navigation';

export function ForgotPasswordScreen({
  navigation,
}: AuthScreenProps<'ForgotPassword'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    const emailErr = validateEmail(email, t);
    setError(emailErr ?? undefined);
    if (emailErr) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await forgotPasswordRequest(email.trim());
      setSent(true);
    } catch (err) {
      setFormError(getApiErrorMessage(err, t('auth.forgotFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.forgotTitle')}
      subtitle={sent ? t('auth.forgotSentSubtitle') : t('auth.forgotSubtitle')}
    >
      {formError ? (
        <Banner tone="error" message={formError} style={styles.banner} />
      ) : null}

      {sent ? (
        <Banner tone="success" message={t('auth.forgotSentBanner')} style={styles.banner} />
      ) : (
        <>
          <TextField
            label={t('auth.email')}
            icon="email-outline"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={error}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
          <Button
            label={t('auth.forgotSubmit')}
            onPress={onSubmit}
            loading={submitting}
            style={styles.submit}
          />
        </>
      )}

      <View style={styles.footer}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
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
