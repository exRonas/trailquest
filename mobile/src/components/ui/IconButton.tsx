import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { hitSlop, shadow, useThemeColors } from '../../theme';

interface IconButtonProps {
  name: string;
  onPress?: () => void;
  size?: number;
  color?: string;
  background?: string;
  elevated?: boolean;
  style?: ViewStyle;
}

/** Circular icon button (map controls, back button, etc.). */
export function IconButton({
  name,
  onPress,
  size = 22,
  color,
  background,
  elevated = true,
  style,
}: IconButtonProps): React.ReactElement {
  const theme = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background ?? theme.surface },
        elevated ? shadow.sm : null,
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      <Icon name={name} size={size} color={color ?? theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
