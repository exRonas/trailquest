import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { radius, shadow, spacing, useThemeColors } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
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
  const theme = useThemeColors();
  const cardStyle: StyleProp<ViewStyle>[] = [
    styles.card,
    { backgroundColor: theme.surface, borderColor: theme.border },
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
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
});
