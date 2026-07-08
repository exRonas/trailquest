import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './AppText';
import { radius, spacing, typography, useThemeColors } from '../../theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  icon?: string;
  /** Adds a show/hide toggle and starts obscured. */
  secure?: boolean;
}

/** Styled, themed text input with label, icon, password toggle and error state. */
export function TextField({
  label,
  error,
  icon,
  secure = false,
  ...rest
}: TextFieldProps): React.ReactElement {
  const theme = useThemeColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  const borderColor = error
    ? theme.danger
    : focused
    ? theme.primary
    : theme.border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="label" color={theme.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        collapsable={false}
        style={[
          styles.inputRow,
          { borderColor, backgroundColor: theme.surface },
          focused ? [styles.focusedShadow, { shadowColor: theme.primary }] : null,
        ]}
      >
        {icon ? (
          <Icon
            name={icon}
            size={20}
            color={focused ? theme.primary : theme.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={hidden}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            style={styles.toggle}
          >
            <Icon
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={theme.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={theme.danger} style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 50,
  },
  focusedShadow: {
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  leftIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
  },
  toggle: { paddingLeft: spacing.sm },
  error: { marginTop: spacing.xs },
});
