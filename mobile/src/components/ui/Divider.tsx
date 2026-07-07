import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

export function Divider({ style }: { style?: ViewStyle }): React.ReactElement {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
