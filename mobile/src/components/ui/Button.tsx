import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './AppText';
import { colors, radius, spacing } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const heights: Record<Size, number> = { sm: 38, md: 48, lg: 56 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps): React.ReactElement {
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const animate = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();

  const palette = getVariantStyle(variant);

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth ? styles.fullWidth : null,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => animate(0.97)}
        onPressOut={() => animate(1)}
        style={[
          styles.base,
          { height: heights[size], backgroundColor: palette.bg },
          palette.border ? { borderWidth: 1.5, borderColor: palette.border } : null,
          isDisabled ? styles.disabled : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={palette.fg} />
        ) : (
          <>
            {icon ? (
              <Icon
                name={icon}
                size={size === 'sm' ? 16 : 20}
                color={palette.fg}
                style={styles.icon}
              />
            ) : null}
            <AppText
              variant={size === 'sm' ? 'label' : 'bodyStrong'}
              color={palette.fg}
            >
              {label}
            </AppText>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

function getVariantStyle(variant: Variant): {
  bg: string;
  fg: string;
  border?: string;
} {
  switch (variant) {
    case 'secondary':
      return { bg: colors.surface, fg: colors.primary, border: colors.primary };
    case 'ghost':
      return { bg: 'transparent', fg: colors.primary };
    case 'danger':
      return { bg: colors.danger, fg: colors.textInverse };
    case 'primary':
    default:
      return { bg: colors.primary, fg: colors.textInverse };
  }
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  base: {
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  disabled: { opacity: 0.5 },
  icon: { marginRight: spacing.sm },
});
