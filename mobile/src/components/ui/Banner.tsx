import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './AppText';
import { colors, radius, spacing, useThemeColors, ThemeColors } from '../../theme';

type Tone = 'error' | 'warning' | 'info' | 'success';

function toneMap(theme: ThemeColors): Record<Tone, { fg: string; bg: string; icon: string }> {
  return {
    error: { fg: colors.danger, bg: colors.dangerSoft, icon: 'alert-circle-outline' },
    warning: { fg: colors.warning, bg: colors.warningSoft, icon: 'alert-outline' },
    info: { fg: colors.info, bg: colors.infoSoft, icon: 'information-outline' },
    success: { fg: colors.success, bg: theme.primarySoft, icon: 'check-circle-outline' },
  };
}

interface BannerProps {
  tone?: Tone;
  message: string;
  style?: ViewStyle;
}

export function Banner({
  tone = 'info',
  message,
  style,
}: BannerProps): React.ReactElement {
  const theme = useThemeColors();
  const t = toneMap(theme)[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }, style]}>
      <Icon name={t.icon} size={18} color={t.fg} style={styles.icon} />
      <AppText variant="callout" color={t.fg} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  icon: { marginRight: spacing.sm },
  text: { flex: 1 },
});
