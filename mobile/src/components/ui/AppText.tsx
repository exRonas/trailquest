import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { colors, typography } from '../../theme';
import { TypographyVariant } from '../../theme/typography';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
  children: React.ReactNode;
}

/**
 * The single text primitive. Always use this instead of raw <Text> so the type
 * scale and colours stay consistent.
 */
export function AppText({
  variant = 'body',
  color = colors.text,
  center,
  style,
  children,
  ...rest
}: AppTextProps): React.ReactElement {
  const composed: TextStyle = {
    ...typography[variant],
    color,
    ...(center ? { textAlign: 'center' } : null),
  };
  return (
    <Text style={[composed, style]} {...rest}>
      {children}
    </Text>
  );
}
