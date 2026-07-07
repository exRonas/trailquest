import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
}

export function Card({
  children,
  onPress,
  style,
  padded = true,
  elevated = true,
}: CardProps): React.ReactElement {
  const cardStyle: ViewStyle[] = [
    styles.card,
    padded ? styles.padded : {},
    elevated ? shadow.sm : {},
    style ?? {},
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...cardStyle, pressed ? styles.pressed : null]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
});
