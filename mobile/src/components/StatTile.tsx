import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './ui';
import { spacing, useDesignVersion, useThemeColors } from '../theme';

interface StatTileProps {
  icon: string;
  value: string;
  label: string;
  /** Render large (navigation HUD) vs compact (cards). */
  emphasis?: boolean;
  color?: string;
  style?: ViewStyle;
}

export function StatTile({
  icon,
  value,
  label,
  emphasis = false,
  color,
  style,
}: StatTileProps): React.ReactElement {
  const theme = useThemeColors();
  const design = useDesignVersion();
  // Atlas: stat icons carry the terracotta accent so number blocks read as
  // field-guide annotations rather than gray chrome.
  const iconColor =
    design === 'v3' ? theme.accent : emphasis ? theme.primary : theme.textMuted;
  return (
    <View style={[styles.tile, style]}>
      <Icon name={icon} size={emphasis ? 22 : 16} color={iconColor} />
      <AppText
        variant={emphasis ? 'title' : 'bodyStrong'}
        color={color ?? theme.text}
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </AppText>
      <AppText
        variant={emphasis ? 'caption' : 'overline'}
        color={theme.textMuted}
        style={styles.label}
        numberOfLines={2}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  value: { marginTop: spacing.xs },
  label: { textAlign: 'center' },
});
