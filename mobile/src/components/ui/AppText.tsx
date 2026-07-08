import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { typography, useThemeColors } from '../../theme';
import { TypographyVariant } from '../../theme/typography';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
  children: React.ReactNode;
}

/**
 * The single text primitive. Always use this instead of raw <Text> so the type
 * scale and colours stay consistent. Defaults to the theme's text color so it
 * stays readable in dark mode; pass `color` to override.
 */
export function AppText({
  variant = 'body',
  color,
  center,
  style,
  children,
  ...rest
}: AppTextProps): React.ReactElement {
  const theme = useThemeColors();
  const composed: TextStyle = {
    ...typography[variant],
    color: color ?? theme.text,
    ...(center ? { textAlign: 'center' } : null),
  };
  return (
    <Text style={[composed, style]} {...rest}>
      {children}
    </Text>
  );
}
