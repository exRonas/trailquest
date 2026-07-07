import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './AppText';
import { Button } from './Button';
import { colors, spacing, useThemeColors } from '../../theme';

/** Centred full-area loading spinner. */
export function Loader({ message }: { message?: string }): React.ReactElement {
  const theme = useThemeColors();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.primary} />
      {message ? (
        <AppText
          variant="callout"
          color={colors.textSecondary}
          style={styles.spaced}
          center
        >
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'compass-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps): React.ReactElement {
  const theme = useThemeColors();
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} size={34} color={theme.primary} />
      </View>
      <AppText variant="heading" center style={styles.spaced}>
        {title}
      </AppText>
      {message ? (
        <AppText
          variant="callout"
          color={colors.textSecondary}
          center
          style={styles.message}
        >
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps): React.ReactElement {
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, styles.errorCircle]}>
        <Icon name="alert-circle-outline" size={34} color={colors.danger} />
      </View>
      <AppText variant="heading" center style={styles.spaced}>
        {title}
      </AppText>
      <AppText
        variant="callout"
        color={colors.textSecondary}
        center
        style={styles.message}
      >
        {message}
      </AppText>
      {onRetry ? (
        <Button
          label="Try again"
          icon="refresh"
          onPress={onRetry}
          variant="secondary"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCircle: { backgroundColor: colors.dangerSoft },
  spaced: { marginTop: spacing.lg },
  message: { marginTop: spacing.sm, maxWidth: 300 },
  action: { marginTop: spacing.xl },
});
