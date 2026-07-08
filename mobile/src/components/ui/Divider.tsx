import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { spacing, useThemeColors } from '../../theme';

export function Divider({ style }: { style?: ViewStyle }): React.ReactElement {
  const theme = useThemeColors();
  return <View style={[styles.divider, { backgroundColor: theme.border }, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
});
